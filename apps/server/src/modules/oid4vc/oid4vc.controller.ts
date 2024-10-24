import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBody,
  ApiExcludeController,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { wsServer } from '../../main';
import { IdentityService } from '../../services/identity.service';
import { UserSession } from '../../decorators/UserSession';
import { Session, User } from '../../entities';
import { SiopOfferService } from './siopOffer.service';
import { DidsService } from '../dids/dids.service';
import { CredOfferService } from './credOffer.service';
import { ApplicationsService } from '../applications/applications.service';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../users/sessions.service';
import { Request } from 'express';
import { Bitstring } from '@digitalcredentials/bitstring';
import { getResolver } from '../../utils';
import { DataSource } from 'typeorm';
import { Serialize } from '../../middlewares/interceptors/serialize.interceptors';
import { errors } from '../../errors';
import { PresentationDefinitionV2 } from '@sphereon/pex-models';
import {
  SiopOfferDTO,
  TokenResponseDTO,
  TokenRequestDTO,
  CredOfferDTO,
  BaseCredOfferDTO,
  SiopRequestDTO,
} from '@repo/dtos';

@ApiTags('OpenID')
@ApiExcludeController()
@Controller('oid4vc')
export class Oid4vcController {
  constructor(
    private identityService: IdentityService,
    private siopOfferService: SiopOfferService,
    private credOfferService: CredOfferService,
    private usersService: UsersService,
    private sessionsService: SessionsService,
    private didsService: DidsService,
    private dataSource: DataSource,
    private applicationsService: ApplicationsService,
  ) {}

  @Serialize(SiopOfferDTO)
  @ApiOkResponse({ type: SiopOfferDTO })
  @Get('/siop')
  async newSiopRequest(
    @UserSession() session: Session,
    @Query('applicationId') applicationId: string | null = null,
  ) {
    const state = applicationId
      ? `${session.id}::${applicationId}`
      : session.id;
    const siopRequest = await (
      await this.identityService.getAdminDid()
    ).rp.createRequest({
      state,
      requestBy: 'reference',
      requestUri: new URL(
        `/api/oid4vc/siop/${session.id}`,
        process.env.PUBLIC_BASE_URI,
      ).toString(),
      responseType: 'id_token',
    });
    const application = applicationId
      ? await this.applicationsService.findById(applicationId)
      : null;
    const offerExists = await this.siopOfferService.findById(session.id);
    if (offerExists) {
      await this.siopOfferService.findByIdAndUpdate(session.id, {
        request: siopRequest.request,
        application,
      });
    } else {
      await this.siopOfferService.create({
        id: session.id,
        request: siopRequest.request,
        application,
      });
    }
    return siopRequest;
  }

  @ApiOkResponse({ type: String })
  @ApiNotFoundResponse({ type: NotFoundException })
  @Get('/siop/:id')
  async getSiopRequestById(@Param('id') id: string) {
    const { request } = await this.siopOfferService.findById(id);
    return request;
  }

  @Serialize(TokenResponseDTO)
  @Post('/:identity/token')
  @ApiOkResponse({ type: TokenResponseDTO })
  @ApiNotFoundResponse({ type: NotFoundException })
  @ApiInternalServerErrorResponse({ type: InternalServerErrorException })
  async tokenEndpoint(
    @Param('identity') identity: string,
    @Body() body: TokenRequestDTO,
  ) {
    const didConfig = await this.didsService.findOne({
      url: identity,
    });
    const { issuer } = await this.identityService.getDid({
      did: didConfig.did,
    });
    const response = await issuer.createTokenResponse(body);
    return response;
  }

  @Serialize(CredOfferDTO)
  @ApiOkResponse({ type: CredOfferDTO })
  @ApiNotFoundResponse({ type: NotFoundException })
  @Get('/credentials/:id')
  async createCredentialOffer(
    @Param('id') id: string,
    @UserSession() session: Session,
  ) {
    const application = await this.applicationsService.findById(id, {
      template: {
        defaultSigningIdentity: true,
      },
      user: true,
      organization: true,
    });
    if (application.status !== 'approved')
      throw new BadRequestException(errors.oid.NOT_APPROVED);
    const { issuer } = await this.identityService.getDid({
      did: application.template.defaultSigningIdentity.did,
    });

    const offer = await issuer.createCredentialOffer(
      {
        credentials: [application.template.name],
        requestBy: 'reference',
        credentialOfferUri: new URL(
          `/api/oid4vc/offers/${id}`,
          process.env.PUBLIC_BASE_URI,
        ).toString(),
        pinRequired: false,
      },
      {
        applicationId: application.id,
        state: session.id,
      },
    );
    const offerExists = await this.credOfferService.findById(id);
    if (!offerExists) {
      await this.credOfferService
        .create({ id, offer: offer.offer })
        .catch(() => null);
    } else {
      await this.credOfferService.findByIdAndUpdate(id, {
        offer: offer.offer,
      });
    }
    return offer;
  }

  @Serialize(BaseCredOfferDTO)
  @Get('/offers/:id')
  @ApiOkResponse({ type: BaseCredOfferDTO })
  @ApiNotFoundResponse({ type: NotFoundException })
  async getCredOffer(@Param('id') id: string) {
    const { offer } = await this.credOfferService.findById(id);
    return offer;
  }

  @Post('/credential')
  async sendCredential(@Req() req: Request) {
    const didJWT = await import('did-jwt');
    const token = req.headers.authorization?.split('Bearer ')[1];
    const resolver = await getResolver();
    if (!token) throw new UnauthorizedException(errors.oid.NO_TOKEN);
    const { payload } = await didJWT.verifyJWT(token, {
      policies: { aud: false },
      resolver,
    });
    const application = await this.applicationsService.findById(
      payload.applicationId,
      {
        organization: true,
        credentialIssuance: true,
        user: true,
        template: {
          defaultSigningIdentity: true,
        },
      },
    );
    if (application.status !== 'approved')
      throw new BadRequestException(errors.oid.NOT_APPROVED);
    const identity = await this.identityService.getDid({
      did: application.template.defaultSigningIdentity.did,
    });

    const did = await identity.issuer.validateCredentialsResponse({
      token,
      proof: req.body.proof.jwt,
    });

    let user: User;
    if (!application.user) {
      user = await this.usersService.findOne({ did });
      if (!user) {
        user = await this.usersService.create({ did });
      }
    }
    const { applicationIndex } = application.credentialIssuance;
    const credentialTemplate = application.template;
    if (!application.claimed) {
      await this.dataSource.manager.transaction(async (t) => {
        const credential = await this.templatesService.findById(
          application.template.id,
        );
        const buffer = await Bitstring.decodeBits({
          encoded: credential.encodedList,
        });
        const bitstring = new Bitstring({ buffer });
        bitstring.set(applicationIndex, true);
        const encoded = await bitstring.encodeBits();
        credential.encodedList = encoded;
        application.claimed = true;
        await t.save(application);
        await t.save(credential);
      });
    }

    const url = new URL(
      `/api/credentials/${application.template.id}/status/1`,
      process.env.PUBLIC_BASE_URI,
    ).toString();

    if (!application.user) {
      await this.applicationsService.findByIdAndUpdate(application.id, {
        user,
      });
    }
    const _credential = application.template;

    const approval = Math.floor(application.approvalTimeStamp.getTime() / 1000);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const expiryDate = parseInt(approval) + parseInt(_credential.duration);

    if (application.template.type === 'badge') {
      const verifiableCredential =
        await identity.account.credentials.createBadge({
          recipientDid: did,
          extras: {
            credentialStatus: {
              id: url + `#${applicationIndex}`,
              type: 'BitstringStatusListEntry',
              purpose: 'revocation',
              statusListIndex: applicationIndex.toString(),
              statusListCredential: url,
            },
          },
          body: {
            ...application.body,
          },
          expiryDate,
          description: credentialTemplate.badgeFields.description,
          badgeName: credentialTemplate.name,
          criteria: credentialTemplate.badgeFields.criteria,
          image: credentialTemplate.icon,
          id: `https://${application.template.defaultSigningIdentity.url}/verify/${application.id}`,
          keyIndex: 0,
          issuerName: application.organization.name,
          type: application.template.name,
        });
      const response = await identity.issuer.createSendCredentialsResponse({
        credentials: [verifiableCredential.cred],
      });

      wsServer.broadcast(payload.state, { credential: true });
      return response;
    } else {
      const verifiableCredential = await identity.account.credentials.create({
        recipientDid: did,
        extras: {
          credentialStatus: {
            id: url + `#${applicationIndex}`,
            type: 'BitstringStatusListEntry',
            purpose: 'revocation',
            statusListIndex: applicationIndex.toString(),
            statusListCredential: url,
          },
        },
        expiryDate,
        body: {
          ...application.template.prefilledFields,
          ...application.body,
          enrichment: {
            logo_uri:
              application.template.icon ??
              application.organization.logo ??
              null,
          },
        },
        id: `https://${application.template.defaultSigningIdentity.url}/verify/${application.id}`,
        keyIndex: 0,
        type: application.template.name,
      });
      const response = await identity.issuer.createSendCredentialsResponse({
        credentials: [verifiableCredential.cred],
      });

      wsServer.broadcast(payload.state, { credential: true });
      return response;
    }
  }

  @ApiBody({ type: SiopRequestDTO })
  @Post('/auth')
  async verifyAuthResponse(@Body() body: SiopRequestDTO) {
    const { state } = body;
    const { id_token: idToken, vp_token: vpToken } = body;
    if (idToken) {
      const isFlowLoginAttempt = state.includes('::');
      const { rp } = await this.identityService.getAdminDid();
      await rp.verifyAuthResponse(body);
      const { iss } = await rp.validateJwt(idToken);

      if (isFlowLoginAttempt) {
        const [sessionId, applicationId] = state.split('::');
        const application = await this.applicationsService.findById(
          applicationId,
          {
            flow: { steps: true },
            stepActions: true,
          },
        );
        const currentStepIndex = application.stepActions.length;
        const currentStepConfig = application.flow.steps.find(
          (s) => s.index === currentStepIndex,
        );

        await this.stepActionsService.create({
          stepConfig: currentStepConfig,
          status: 'proceed',
          application,
          metadata: {
            did: iss,
          },
        });

        wsServer.broadcast(sessionId, { shared: true });
      } else {
        let user = await this.usersService.findOne({ did: iss });

        // in case existing user tries signing up again
        if (user) {
          await this.sessionsService.findByIdAndUpdate(state, {
            isValid: true,
            did: iss,
            user,
          });
          wsServer.broadcast(state, {
            error: 'User already exists!',
            login: !!user.email || !!user.organization,
            user,
          });
          return {};
        } else user = await this.usersService.create({ did: iss });
        await this.sessionsService.findByIdAndUpdate(state, {
          isValid: true,
          did: iss,
          user,
        });
        wsServer.broadcast(state, {
          login: !!user.email || !!user.organization,
          user,
        });
      }

      return {};
    } else {
      const { rp } = await this.identityService.getAdminDid();

      const sessionId = state.split('::')[0];
      const siopId = state.split('::')[1];

      const siopSession = await this.siopOfferService.findById(siopId, {
        application: { flow: { steps: true }, stepActions: true },
      });

      const { iss } = await rp.validateJwt(vpToken);
      const currentStepIndex = siopSession.application.stepActions.length;
      const currentStepConfig = siopSession.application.flow.steps.find(
        (s) => s.index === currentStepIndex,
      );

      await rp.verifyAuthResponse(
        body,
        siopSession.pex as PresentationDefinitionV2,
      );
      await this.stepActionsService.create({
        stepConfig: currentStepConfig,
        status: 'proceed',
        application: siopSession.application,
        metadata: {
          did: iss,
        },
      });
      wsServer.broadcast(sessionId, { shared: true });
    }
  }
}
