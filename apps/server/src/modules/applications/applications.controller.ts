import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Param,
  BadRequestException,
  Inject,
  forwardRef,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { CurrentUser } from '../../decorators/CurrentUser';
import { Application, Session, User } from '../../entities';
import { ApplicationsService } from './applications.service';
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
import { paginate, validateEmail, validateJsonWebToken } from '../../utils';
import { IsNull, Not, DataSource, In } from 'typeorm';
import { Bitstring } from '@digitalcredentials/bitstring';
import { Serialize } from '../../middlewares/interceptors/serialize.interceptors';
import { ApiOkResponsePaginated } from '../../decorators';
import { PAGE_SIZE } from 'src/config/conf';
import { NotificationsService } from '../../services/notification.service';
import { compareSorted } from '../../utils/misc/sort';
import { errors } from '../../errors';
import { IdentityService } from 'src/services/identity.service';
import { UserSession } from 'src/decorators/UserSession';
import { v4 as uuidv4 } from 'uuid';
import { SiopOfferService } from '../oid4vc/siopOffer.service';
import {
  ApplicationByTokenDTO,
  ApplicationDTO,
  ApplicationStatus,
  CreateApplicationDTO,
  PaginatedUserApplicationsDTO,
  UserApplicationDTO,
} from '@repo/dtos';

@ApiTags('applications')
@Controller('applications')
export class ApplicationsController {
  constructor(
    private dataSource: DataSource,
    private applicationsService: ApplicationsService,
    private identityService: IdentityService,
    private siopService: SiopOfferService,
    private notificationsService: NotificationsService,
  ) {}

  @Post()
  @IsAuthenticated()
  @Serialize(ApplicationDTO)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Create New Application' })
  @ApiExcludeEndpoint()
  @ApiBody({ type: CreateApplicationDTO })
  @ApiOkResponse({ type: ApplicationDTO })
  async createNewApplication(
    @Body() body: CreateApplicationDTO,
    @CurrentUser() user: User,
  ) {
    const application = await this.applicationsService.create({
      body: body.body,
      user: user,
      source: 'application',
    });
    await this.notificationsService.applicationCreatedNotification(application);
    return application;
  }

  @Post('/external')
  @ApiOperation({
    summary: 'Create new Application',
    description:
      'Create new application for a user, you can either pass the user object or pass an email in this endpoint, the `email` being a preferred method for a user to be notified of them being issued a credential',
  })
  @ApiBody({ type: CreateApplicationDTO })
  @ApiOkResponse()
  @ApiBadRequestResponse({ type: BadRequestException })
  async createNewExternalApplication(@Body() body: CreateApplicationDTO) {
    const { email, templateId } = body;
    if (!email || !validateEmail(email))
      throw new BadRequestException(errors.applications.BAD_RECIPIENT_EMAIL);
    await this.applicationsService.create({
      body: body.body,
      status: 'pending',
      email,
      source: 'application',
    });
    return;
  }

  @Get()
  @IsAuthenticated()
  @Serialize(PaginatedUserApplicationsDTO)
  @ApiCookieAuth()
  @ApiOkResponsePaginated(UserApplicationDTO)
  @ApiExcludeEndpoint()
  async getAllUserApplications(
    @CurrentUser() user: User,
    @Query('page') page: string | number,
    @Query('status') status: string,
  ) {
    page = page ? parseInt(page as string) : 1;

    const [applications, count] =
      await this.applicationsService.findManyAndCount(
        {
          user: { id: user.id },
          status:
            !status || status === 'all'
              ? Not(IsNull())
              : (status as ApplicationStatus),
        },
        {},
        { createdAt: 'DESC' },
        { take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE },
      );
    const paginated = paginate(applications, page, count);
    return paginated;
  }

  //   @Post('/:id/revoke')
  //   @IsAuthenticated()
  //   @IsStaff()
  //   @HasPermission('manageApplications')
  //   @ApiSecurity('API Key')
  //   @ApiOperation({
  //     summary: 'Revoke Application by ID',
  //     description: 'Revoke an application by ID',
  //   })
  //   @ApiCookieAuth()
  //   @ApiOkResponse({})
  //   async revokeCredential(@Param('id') id: string) {
  //     const application = await this.applicationsService.findById(id, {
  //       credentialIssuance: true,
  //       template: true,
  //     });

  //     const applicationIndex = application.credentialIssuance.applicationIndex;

  //     await this.dataSource.manager.transaction(async (t) => {
  //       const credential = await this.templatesService.findById(
  //         application.template.id,
  //       );
  //       const buffer = await Bitstring.decodeBits({
  //         encoded: credential.encodedList,
  //       });
  //       const bitstring = new Bitstring({ buffer });
  //       bitstring.set(applicationIndex, false);
  //       const encoded = await bitstring.encodeBits();
  //       credential.encodedList = encoded;
  //       application.status = 'revoked';
  //       await t.save(credential);
  //       await t.save(application);
  //     });

  //     return { status: 'revoked' };
  //   }

  //   @Post('/by-token')
  //   @Serialize(ApplicationDTO)
  //   @ApiOkResponse({ type: ApplicationDTO })
  //   @ApiExcludeEndpoint()
  //   async getApplicationByToken(@Body() body: ApplicationByTokenDTO) {
  //     const { token } = body;
  //     const { payload } = validateJsonWebToken(token);
  //     if (!payload) throw new BadRequestException(errors.applications.NO_DATA);
  //     const application = await this.applicationsService.findById(
  //       payload.applicationId,
  //       {
  //         template: true,
  //       },
  //     );
  //     return application;
  //   }

  //   async parseStepConfig(
  //     step: StepConfig,
  //     templates: Template[],
  //     application: Application,
  //     state: string,
  //   ) {
  //     if (step.type === 'presentation') {
  //       const id = uuidv4();
  //       const input_descriptors = templates.map((t, i) => {
  //         return {
  //           id: `pex-case-${i}`,
  //           constraints: {
  //             fields: [
  //               {
  //                 path: ['$.vc.type'],
  //                 filter: {
  //                   type: 'array',
  //                   contains: {
  //                     type: 'string',
  //                     pattern: t.name,
  //                   },
  //                 },
  //               },
  //             ],
  //           },
  //         };
  //       });

  //       const did = await this.identityService.getAdminDid();

  //       const pexBase = {
  //         id: application.id,
  //         input_descriptors,
  //       };

  //       const { request, uri } = await did.rp.createRequest({
  //         requestBy: 'reference',
  //         requestUri: new URL(
  //           `/api/oid4vc/siop/${id}`,
  //           process.env.PUBLIC_BASE_URI,
  //         ).toString(),
  //         presentationDefinition: pexBase,
  //         state: `${state}::${id}`,
  //         responseType: 'vp_token',
  //       });
  //       await this.siopService.create({
  //         id,
  //         request,
  //         pex: pexBase,
  //         application,
  //       });
  //       return { uri };
  //     }
  //   }

  //   @Get('/:id')
  //   @ApiOperation({
  //     summary: 'Get Application By ID',
  //     description: "Get an application by it's ID expanded with it's steps",
  //   })
  //   @Serialize(ApplicationDTO)
  //   @ApiOkResponse({ type: ApplicationDTO })
  //   async getFlowApplication(
  //     @Param('id') id: string,
  //     @UserSession() session: Session,
  //     @Query('token') token: string | null,
  //   ) {
  //     const flowApplication = await this.applicationsService.findById(id, {
  //       organization: true,
  //       template: {
  //         defaultSigningIdentity: true,
  //       },
  //       flow: { steps: true },
  //       stepActions: true,
  //     });
  //     if (flowApplication.flow.type === 'credential') {
  //       if (!token) throw new UnauthorizedException('Token is required');
  //       const { payload, expired } = validateJsonWebToken(token);
  //       if (expired) throw new UnauthorizedException('Token Expired');
  //       if (
  //         payload.scope !== 'flow-credential-application' ||
  //         payload.applicationId !== flowApplication.id
  //       )
  //         throw new UnauthorizedException('Incorrect Token');
  //     }
  //     if (flowApplication.source !== 'flow') throw new NotFoundException();
  //     const currentStep =
  //       flowApplication.stepActions.length === 0
  //         ? 0
  //         : flowApplication.stepActions[flowApplication.stepActions.length - 1]
  //               .status === 'defer'
  //           ? flowApplication.stepActions.length - 1
  //           : flowApplication.stepActions.length;
  //     const currentStepConfig = flowApplication.flow.steps.find(
  //       (f) => f.index === currentStep,
  //     );
  //     let serializedConfig: Record<string, any>;

  //     if (currentStepConfig.type === 'presentation') {
  //       const templates = await this.templatesService.findMany(
  //         {
  //           id: In(currentStepConfig.config.templates as string[]),
  //         },
  //         {
  //           defaultSigningIdentity: true,
  //         },
  //       );

  //       serializedConfig = await this.parseStepConfig(
  //         currentStepConfig,
  //         templates,
  //         flowApplication,
  //         session.id,
  //       );
  //     } else if (['userForm', 'issuerForm'].includes(currentStepConfig.type)) {
  //       serializedConfig = currentStepConfig.config;
  //     } else if (currentStepConfig.type === 'didLogin') {
  //       serializedConfig = {};
  //     } else if (currentStepConfig.type === 'kyc') {
  //       const extensionsConfig = await this.extensionsService.findOne({
  //         extensionType: ValidExtensionTypes.COMPLY,
  //         organization: {
  //           id: flowApplication.organization.id,
  //         },
  //       });
  //       const key =
  //         // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //         // @ts-ignore
  //         currentStepConfig.kycLevel === 'basic'
  //           ? extensionsConfig.secrets.basicKey
  //           : extensionsConfig.secrets.amlKey;
  //       serializedConfig = { key };
  //     }
  //     return {
  //       ...flowApplication,
  //       currentStep: {
  //         type: currentStepConfig.type,
  //         config: serializedConfig,
  //       },
  //     };
  //   }
}
