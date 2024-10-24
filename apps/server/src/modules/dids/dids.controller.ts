import {
    BadRequestException,
    Body,
    Controller,
    ForbiddenException,
    Get,
    NotFoundException,
    Param,
    Post,
    Delete,
    InternalServerErrorException,
    Patch,
    ConflictException,
} from '@nestjs/common';
import { DidsService } from './dids.service';
import { IdentityService } from '../../services/identity.service';
import { OrganizationService } from '../organization/organization.service';
import {
    HasPermission,
    IsAuthenticated,
    IsStaff,
} from '../../middlewares/guards/auth.guard';
import { CurrentOrganization } from '../../decorators/CurrentUser';
import { Organization } from '../../entities';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiCookieAuth,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiSecurity,
    ApiTags,
} from '@nestjs/swagger';
import { resolveCname } from 'dns/promises';
import { SslService } from './ssl.service';
import { OrganizationCredentialsService } from './organizationCredentials.service';
import { Serialize } from '../../middlewares/interceptors/serialize.interceptors';
import { errors } from '../../errors';
import {
    IdentityDTO,
    CreateDidDTO,
    UpdateDidDTO,
    DnsStatusDTO,
    ProcessIDResponseDTO,
    ProcessRequestDTO,
    CreatePresentationDTO,
    IdentityCredentialDTO,
} from '@repo/dtos';

@IsAuthenticated()
@IsStaff()
@ApiTags('DID')
@ApiCookieAuth()
@ApiSecurity('API Key')
@Controller('dids')
export class DidsController {
    constructor(
        private didsService: DidsService,
        private identityService: IdentityService,
        private organizationService: OrganizationService,
        private organizationCredentialService: OrganizationCredentialsService,
        private sslService: SslService,
    ) {}

    @Post()
    @HasPermission('manageOrganizationId')
    @Serialize(IdentityDTO)
    @ApiBody({ type: CreateDidDTO })
    @ApiOkResponse({ type: IdentityDTO })
    @ApiForbiddenResponse({ type: ForbiddenException })
    @ApiOperation({
        summary: 'Create a new DID',
        description: 'Create a new DID for your organization',
    })
    async createIdentity(
        @Body() body: CreateDidDTO,
        @CurrentOrganization() org: Organization,
    ) {
        const { alias, network, url, logo } = body;

        if (org.identities.length >= org.subscription.maxIdentities)
            throw new ForbiddenException(errors.dids.IDENTITY_LIMIT_REACHED);
        const exisitingAlias = await this.identityService
            .getDid({
                alias: url.toLowerCase(),
            })
            .catch(() => null);
        if (exisitingAlias)
            throw new ConflictException(errors.dids.IDENTITY_ALREADY_EXISTS);
        const did = await this.identityService.newDid({
            alias: url.toLowerCase(),
            method: network,
        });

        const identity = await this.didsService.create({
            did: await did.account.getDid(),
            name: alias,
            logo,
            url: url.toLowerCase(),
            organization: org,
        });
        return identity;
    }

    @Post('/credentials/:id/toggle')
    @ApiOperation({ summary: 'Toggle Visibility of Credential' })
    async toggleCredentialVisibility(@Param('id') id: string) {
        const _credential =
            await this.organizationCredentialService.findById(id);
        const credential =
            await this.organizationCredentialService.findByIdAndUpdate(id, {
                discoverable: !_credential.discoverable,
            });
        return credential;
    }

    @Get()
    @ApiOperation({
        summary: 'Get all DIDs',
        description: 'Get all DIDs linked to this organization',
    })
    @Serialize(IdentityDTO)
    @ApiOkResponse({ type: IdentityDTO, isArray: true })
    async getAllIdentities(@CurrentOrganization() org: Organization) {
        const identities = await this.didsService.findMany(
            {
                organization: { id: org.id },
            },
            { identityCredentials: true },
        );
        return identities;
    }

    @Patch('/:id')
    @ApiOperation({
        summary: 'Update DID',
        description: 'Update the metadata of your DID',
    })
    @HasPermission('manageOrganizationId')
    @Serialize(IdentityDTO)
    async updateIdentityDto(
        @Body() body: UpdateDidDTO,
        @Param('id') id: string,
        @CurrentOrganization() org: Organization,
    ) {
        const identity = await this.didsService.findById(id, {
            organization: true,
        });
        if (identity.organization.id !== org.id)
            throw new NotFoundException(errors.dids.ORGANIZATION_NOT_FOUND);
        return this.didsService.findByIdAndUpdate(id, body);
    }

    @Get('/:id/domain')
    @ApiOperation({
        summary: 'Get Domain Status',
        description: 'Get DNS and SSL status for the domain of an identity',
    })
    @HasPermission('manageOrganizationId')
    @Serialize(DnsStatusDTO)
    @ApiOkResponse({ type: DnsStatusDTO })
    async getIdentityStatus(@Param('id') id: string) {
        const did = await this.didsService.findById(id);
        const dns = await resolveCname(did.url);
        const dnsStatus = dns.includes(process.env.PUBLIC_ADMIN_DID);
        const hasSSL = await this.sslService.sslAlreadyExists(did.url);
        if (dnsStatus && !hasSSL)
            await this.sslService.getCertOnDemand(did.url);
        return {
            hasSSL,
            dnsStatus,
        };
    }

    @Post('/:id/domain')
    @ApiOperation({
        summary: 'Provision SSL Certificate',
        description: 'Provision SSL Certificate for a DID domain',
    })
    @HasPermission('manageOrganizationId')
    @ApiOkResponse()
    async provisionDidService(@Param('id') id: string) {
        const identity = await this.didsService.findById(id);
        this.sslService.getCertOnDemand(identity.url);
        return;
    }

    @Post('/:identity/process')
    @HasPermission('manageOrganizationId')
    @Serialize(ProcessIDResponseDTO)
    @ApiOperation({
        summary: 'Obtain OID4VC request metadata',
        description:
            'Process an OID4VC request and get information to present consent',
    })
    @ApiOkResponse({ type: ProcessIDResponseDTO })
    @ApiNotFoundResponse({ type: NotFoundException })
    @ApiBadRequestResponse({ type: BadRequestException })
    async processIdentityRequest(
        @CurrentOrganization() org: Organization,
        @Param('identity') identityId: string,
        @Body() body: ProcessRequestDTO,
    ) {
        const organization = await this.organizationService.findById(org.id, {
            identities: true,
        });
        const identity = await this.didsService.findById(identityId, {
            identityCredentials: true,
        });
        const organizationOwnsDid = organization.identities.find(
            (i) => i.id === identity.id,
        );
        if (!organizationOwnsDid || !identity)
            throw new NotFoundException(errors.dids.NO_OWNERSHIP);
        const did = await this.identityService.getDid({ did: identity.did });
        const { request } = body;
        let requestVariant: 'id' | 'vp' | 'vc';
        let credentialsOffered: string[] = [];
        let requestSource: string;
        let clientName: string;
        let clientImg: string;

        const credentialsRaw = identity.identityCredentials;
        const justVcs = credentialsRaw.filter(
            (c) => !c.decoded.vc.type.includes('OpenBadgeCredential'),
        );
        const credentials = justVcs.map((c) => c.decoded);
        if (request.startsWith('siopv2://')) {
            const payload = await did.op.getRequestFromOffer(request);
            requestVariant = payload.responseType === 'id_token' ? 'id' : 'vp';
            requestSource = payload.redirectUri;
            clientName = payload.clientMetadata.clientName;
            clientImg = payload.clientMetadata.logoUri;

            if (requestVariant === 'vp') {
                const credentialsRequired =
                    await did.op.getCredentialsFromRequest(
                        request,
                        credentials,
                    );
                credentialsOffered = credentialsRequired.map(
                    (c: any) => c.vc.type[1] ?? c.vc.type[0],
                );
            }
        } else if (request.startsWith('openid-credential-offer://')) {
            requestVariant = 'vc';
            const payload = await did.holder.parseCredentialOffer(request);
            const metadata = await did.holder.retrieveMetadata(request);
            requestSource = payload.credentialIssuer;
            credentialsOffered = payload.credentialConfigurationIds;
            clientName = metadata.display.clientName;
            clientImg = metadata.display.logoUri;
        } else {
            throw new BadRequestException(errors.dids.BAD_OID_CRED_OFFER);
        }

        return {
            requestVariant,
            requestSource,
            credentialsOffered,
            clientName,
            clientImg,
        };
    }

    @Post('/:identity/siop')
    @ApiOperation({
        summary: 'Process a SIOP or OID4VP request',
        description: 'Process a SIOP request, requestVariant = id | vp',
    })
    @HasPermission('manageOrganizationId')
    @ApiBody({ type: ProcessRequestDTO })
    async processSiopRequest(
        @CurrentOrganization() org: Organization,
        @Param('identity') identityId: string,
        @Body() body: ProcessRequestDTO,
    ) {
        const organization = await this.organizationService.findById(org.id, {
            identities: true,
        });
        const identity = await this.didsService.findById(identityId, {
            identityCredentials: true,
        });
        const organizationOwnsDid = organization.identities.find(
            (i) => i.id === identity.id,
        );
        if (!organizationOwnsDid || !identity)
            throw new NotFoundException(errors.dids.NO_OWNERSHIP);
        const did = await this.identityService.getDid({ did: identity.did });
        const credentialsRaw = identity.identityCredentials;
        const justVcs = credentialsRaw.filter(
            (c) => !c.decoded.vc.type.includes('OpenBadgeCredential'),
        );
        const credentials = justVcs.map((c) => c.raw);
        const response = await did.op.sendAuthResponse(
            body.request,
            credentials,
        );
        return response;
    }

    @Post('/:identity/credentials')
    @HasPermission('manageOrganizationId')
    @ApiOperation({
        summary: 'Process a VCI request',
        description: 'Process a VCI request, requestVariant = vc',
    })
    @ApiBody({ type: ProcessRequestDTO })
    async obtainIdentityCredentials(
        @CurrentOrganization() org: Organization,
        @Param('identity') identityId: string,
        @Body() body: ProcessRequestDTO,
    ) {
        const organization = await this.organizationService.findById(org.id, {
            identities: true,
        });
        const identity = await this.didsService.findById(identityId);
        const organizationOwnsDid = organization.identities.find(
            (i) => i.id === identity.id,
        );
        if (!organizationOwnsDid || !identity)
            throw new NotFoundException(errors.dids.NO_OWNERSHIP);
        const did = await this.identityService.getDid({ did: identity.did });

        const credentialsRaw = await did.holder
            .getCredentialFromOffer(body.request)
            .catch((e) => {
                // console.error(e);
                throw new InternalServerErrorException({
                    ...errors.dids.INTERNAL_SERVER_ERR,
                    e,
                });
            });
        const didJWT = await import('did-jwt');
        const credentialsParsed = await Promise.all(
            credentialsRaw.map(async (c) => {
                const decoded = await didJWT.decodeJWT(c);
                return {
                    decoded: decoded.payload,
                    raw: c,
                    identity,
                };
            }),
        );
        const credentials =
            await this.organizationCredentialService.createBulk(
                credentialsParsed,
            );
        return credentials;
    }

    @Post('/:identity/presentations')
    @HasPermission('manageOrganizationId')
    @ApiBody({ type: CreatePresentationDTO })
    @ApiOperation({
        summary: 'Create a new VP',
        description:
            'Create a new Verifiable Presentation with the credentials specified',
    })
    @ApiOperation({})
    async createPresentaiton(
        @CurrentOrganization() org: Organization,
        @Param('identity') identityId: string,
        @Body() body: CreatePresentationDTO,
    ) {
        const organization = await this.organizationService.findById(org.id, {
            identities: true,
        });
        const identity = await this.didsService.findById(identityId);
        const organizationOwnsDid = organization.identities.find(
            (i) => i.id === identity.id,
        );
        if (!organizationOwnsDid || !identity)
            throw new NotFoundException(errors.dids.NO_OWNERSHIP);
        const did = await this.identityService.getDid({ did: identity.did });

        const presentation = await did.account.createPresentation(body.creds);
        return presentation;
    }

    @Delete('/:identity/credentials/:id')
    @HasPermission('manageOrganizationCredentials')
    @Serialize(IdentityCredentialDTO)
    @ApiOkResponse({ type: IdentityCredentialDTO })
    @ApiNotFoundResponse({ type: NotFoundException })
    @ApiOperation({
        summary: 'Delete a DID credential',
        description: 'Delete a credential owned by this DID',
    })
    async deleteIdentityCredential(
        @CurrentOrganization() org: Organization,
        @Param('identity') identityId: string,
        @Param('id') id: string,
    ) {
        const organization = await this.organizationService.findById(org.id, {
            identities: true,
        });
        const identity = await this.didsService.findById(identityId, {
            identityCredentials: true,
        });
        const organizationOwnsDid = organization.identities.find(
            (i) => i.id === identity.id,
        );
        if (!organizationOwnsDid || !identity)
            throw new NotFoundException(errors.dids.NO_OWNERSHIP);
        if (!identity.identityCredentials.find((c) => c.id === id))
            throw new NotFoundException(errors.dids.CRED_NOT_FOUND);
        const credential =
            await this.organizationCredentialService.findByIdAndDelete(id);
        return credential;
    }
}
