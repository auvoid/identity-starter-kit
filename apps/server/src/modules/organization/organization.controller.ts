import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Patch,
    Post,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { UsersService } from '../users/users.service';
import {
    HasPermission,
    IsAuthenticated,
    IsStaff,
} from '../../middlewares/guards/auth.guard';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiCookieAuth,
    ApiExcludeEndpoint,
    ApiOkResponse,
    ApiOperation,
    ApiSecurity,
    ApiTags,
} from '@nestjs/swagger';
import { Serialize } from '../../middlewares/interceptors/serialize.interceptors';
import { CurrentOrganization, CurrentUser } from '../../decorators/CurrentUser';
import { Organization, User } from '../../entities';
import Stripe from 'stripe';
import { createJsonWebToken, validateJsonWebToken } from 'src/utils';
import { EmailService } from '../email/email.service';
import { CredentialIssuanceService } from '../credential-issuance/credential-issuance.service';
import { errors } from '../../errors';
import {
    OrganizationDTO,
    CreateOrganizationDTO,
    UpdateOrganizationDTO,
} from '@repo/dtos';

@ApiTags('organization')
@Controller('organization')
export class OrganizationController {
    constructor(
        private organizationService: OrganizationService,
        private usersService: UsersService,
        private emailService: EmailService,
        private credentialUsageService: CredentialIssuanceService,
    ) {}

    @Get()
    @Serialize(OrganizationDTO)
    @IsAuthenticated()
    @ApiCookieAuth()
    @ApiSecurity('API Key')
    @IsStaff()
    @HasPermission('manageOrganization')
    @ApiOperation({
        summary: 'Get Organization Details',
        description:
            'Get details of the organization which is currently authenticated',
    })
    async getOrganizationDetails(@CurrentOrganization() org: Organization) {
        return { ...org, owner: org.ownedBy.did };
    }

    @Post('/rotate')
    @IsAuthenticated()
    @IsStaff()
    @HasPermission('manageOrganization')
    @ApiExcludeEndpoint()
    async rotateAdminUser(@CurrentUser() user: User) {
        const { ownedBy } = await this.organizationService.findById(
            user.organization.id,
            { ownedBy: true },
        );
        const token = createJsonWebToken({
            scope: 'organization-rotation',
            id: user.organization.id,
        });
        const url = new URL(
            '/rotate?token=' + token,
            process.env.PUBLIC_CLIENT_URI,
        ).toString();
        await this.emailService.sendOrgOwnerRotationEmail({
            url,
            user: ownedBy,
        });
    }

    @Post(`/rotate-owner`)
    @ApiExcludeEndpoint()
    async rotateOwner(@Body() body: { token: string; did: string }) {
        const { payload, expired } = validateJsonWebToken(body.token);
        if (payload.scope !== 'organization-rotation')
            throw new BadRequestException(errors.org.INVALID_SCOPE);
        if (expired) throw new BadRequestException(errors.org.EXPIRED_TOKEN);
        const organization = await this.organizationService.findById(
            payload.id,
            { ownedBy: true },
        );
        const { ownedBy } = organization;
        const user = await this.usersService.findOne({ did: body.did });

        await this.usersService.findByIdAndUpdate(ownedBy.id, {
            ownedOrganization: null,
        });
        await this.organizationService.findByIdAndUpdate(payload.id, {
            ownedBy: user,
        });
        await this.usersService.findByIdAndUpdate(user.id, { organization });
        return user;
    }

    @Post()
    @IsAuthenticated()
    @ApiCookieAuth()
    @Serialize(OrganizationDTO)
    @ApiBody({ type: CreateOrganizationDTO })
    @ApiOkResponse({ type: OrganizationDTO })
    @ApiBadRequestResponse()
    @ApiExcludeEndpoint()
    async createOrganization(@Body() body: CreateOrganizationDTO) {
        const {
            userId,
            orgName,
            logo,
            organizationUrl,
            email,
            country,
            industry,
        } = body;
        const userExists = await this.usersService.findById(userId);

        if (!userExists) throw new BadRequestException(errors.dids.NO_USER);
        const user = await this.usersService.findByIdAndUpdate(userId, {
            email,
        });

        const organization = await this.organizationService.create({
            name: orgName,
            logo,
            ownedBy: user,
            organizationUrl,
            country,
            industry,
            contactEmail: email,
        });
        await this.usersService.findByIdAndUpdate(userId, {
            organization,
            email,
        });
        return organization;
    }

    @Patch()
    @IsAuthenticated()
    @IsStaff()
    @HasPermission('manageOrganization')
    @Serialize(OrganizationDTO)
    @ApiCookieAuth()
    @ApiSecurity('API Key')
    @ApiOperation({
        summary: 'Update Organization',
        description: 'Update the organization details',
    })
    @ApiBody({ type: UpdateOrganizationDTO })
    @ApiOkResponse({ type: OrganizationDTO })
    async updateOrganizationProfile(
        @CurrentOrganization() org: Organization,
        @Body() body: UpdateOrganizationDTO,
    ) {
        const { description } = body;
        if (description && description.length > 600) {
            throw new BadRequestException(
                'Description must not be more than 600 characters.',
            );
        }
        await this.organizationService.findByIdAndUpdate(org.id, body);
        const updated = await this.organizationService.findById(org.id, {
            identities: true,
        });
        return updated;
    }

    @IsAuthenticated()
    @IsStaff()
    @ApiCookieAuth()
    @ApiExcludeEndpoint()
    @Get('/usage')
    async getUsage(@CurrentUser() user: User) {
        const { subscription } = user.organization;
        const stripe = new Stripe(process.env.STRIPE_SECRET);

        let usageTotal = 0;
        if (!!subscription?.subscriptionId) {
            const invoice = await stripe.invoices.retrieveUpcoming({
                subscription: subscription.subscriptionId,
            });
            usageTotal = invoice.lines.data.reduce(
                (total, current) => total + current.quantity,
                0,
            );
        } else {
            const credentialsIssued =
                await this.credentialUsageService.findMany({
                    template: { organization: { id: user.organization.id } },
                });
            usageTotal = credentialsIssued.length;
        }
        return {
            usage: usageTotal,
            max: subscription?.maxCredentials ?? 5,
        };
    }

    @IsAuthenticated()
    @IsStaff()
    @ApiExcludeEndpoint()
    @Get('verify-email')
    async verifySupportEmail(@CurrentUser() user: User) {
        const org = await this.organizationService.findById(
            user.organization.id,
        );
        await this.emailService.sendOrgEmailVerification({
            org,
        });
    }

    @IsAuthenticated()
    @IsStaff()
    @ApiExcludeEndpoint()
    @Post('verify-email')
    async verifySupportEmailToken(@Body() body: { token: string }) {
        const { payload, expired } = validateJsonWebToken(body.token);
        if (expired) throw new BadRequestException(errors.org.EXPIRED_TOKEN);
        if (payload.scope !== 'email-verification')
            throw new BadRequestException(errors.org.INVALID_SCOPE);
        if (payload.context !== 'org')
            throw new BadRequestException(errors.org.INVALID_CONTEXT);
        const org = await this.organizationService.findById(payload.id);
        await this.organizationService.findByIdAndUpdate(org.id, {
            emailVerified: true,
        });
        console.log(await this.organizationService.findById(org.id));
    }
}
