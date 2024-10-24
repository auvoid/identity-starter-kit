import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { CurrentUser } from '../../decorators';
import { Session, User } from '../../entities';
import { IsAuthenticated } from '../../middlewares/guards';
import { OrganizationService } from '../organization/organization.service';
import { Response } from 'express';
import { SessionsService } from './sessions.service';
import { UserSession } from '../../decorators';
import {
  ApiCookieAuth,
  ApiExcludeController,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserNotificationsService } from './user-notifications.service';
import { NotificationPreferencesService } from './notification-preference.service';
import { PAGE_SIZE } from '../../config/conf';
import {
  createJsonWebToken,
  paginate,
  validateJsonWebToken,
} from '../../utils';
import { EmailService } from '../email/email.service';
import { errors } from '../../errors';

@ApiExcludeController()
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private sessionService: SessionsService,
    private organizationService: OrganizationService,
    private usersService: UsersService,
    private userNotificationsService: UserNotificationsService,
    private notificationPreferencesService: NotificationPreferencesService,
    private emailService: EmailService,
  ) {}

  @Get('/')
  @IsAuthenticated()
  @ApiCookieAuth()
  async getCurrentUser(@CurrentUser() user: User) {
    const organization = await this.organizationService
      .findById(user.organization?.id, {
        ownedBy: true,
        subscription: true,
      })
      .catch(() => null);
    const isOwner = !!organization && organization?.ownedBy?.id === user.id;
    if (isOwner) {
      user.role = {
        ...user.role,
        manageTemplates: true,
        manageApplications: true,
        manageOrganization: true,
        manageOrganizationCredentials: true,
        manageOrganizationId: true,
        manageOrganizationProfiles: true,
        manageRoles: true,
        manageStaff: true,
        manageExtensions: true,
      };
    }
    const unread = await this.userNotificationsService.getUnreadCount(user.id);
    return {
      ...user,
      unread: unread > 0,
      isOwner,
      subscribed: organization?.subscription?.subscribed,
    };
  }

  @ApiOperation({ summary: 'Get the current user cookie session' })
  @Get('/session')
  async getCurrentSession(@UserSession() session: Session) {
    return session;
  }

  @Patch()
  @IsAuthenticated()
  @ApiCookieAuth()
  async patchCurrentUser(
    @CurrentUser() user: User,
    @Body() body: Partial<User>,
  ) {
    return await this.usersService.findByIdAndUpdate(user.id, body);
  }

  @Get('/logout')
  @IsAuthenticated()
  @ApiCookieAuth()
  async logoutUser(
    @Res({ passthrough: true }) res: Response,
    @UserSession() session: Session,
  ) {
    res.cookie('accessToken', '', {
      maxAge: 0,
      httpOnly: true,
    });
    res.cookie('refreshToken', '', {
      maxAge: 0,
      httpOnly: true,
    });
    await this.sessionService.findByIdAndDelete(session.id);
    return;
  }

  @Post('/rotate')
  @IsAuthenticated()
  @ApiCookieAuth()
  async requestKeyRotation(@CurrentUser() user: User) {
    const rotationSecret = createJsonWebToken({
      scope: 'rotation',
      id: user.id,
    });
    const encodedUrl = new URL(
      '/rotate-user-did?token=' + rotationSecret,
      process.env.PUBLIC_CLIENT_URI,
    ).toString();
    await this.emailService.sendUserDidRotateEmail({
      url: encodedUrl,
      user,
    });
  }

  @Post('/rotate-did')
  @IsAuthenticated()
  @ApiCookieAuth()
  async rotateKeyForUser(
    @Body() body: { token: string; did: string },
    @CurrentUser() user: User,
  ) {
    const { payload, expired } = validateJsonWebToken(body.token);
    if (expired) throw new BadRequestException(errors.users.EXPIRED_TOKEN);
    if (payload.scope !== 'rotation')
      throw new BadRequestException(errors.users.INVALID_SCOPE);
    console.log(body.did);
    const _didExists = await this.usersService.findOne(
      { did: body.did },
      { organization: true },
    );
    if (!_didExists.email && !_didExists.organization) {
      await this.usersService.findByIdAndDelete(_didExists.id);
    }
    const _user = await this.usersService.findByIdAndUpdate(user.id, {
      did: body.did,
    });
    return _user;
  }

  @Get('/notifications')
  @IsAuthenticated()
  @ApiCookieAuth()
  async getNotifications(
    @CurrentUser() user: User,
    @Query('page') page: string | number,
  ) {
    page = page ? parseInt(page as string) : 1;

    const [applications, count] =
      await this.userNotificationsService.findManyAndCount(
        {
          userSubject: { id: user.id },
        },
        {
          application: true,
          organization: true,
          template: true,
          userTarget: true,
        },
        { createdAt: 'DESC' },
        { take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE },
      );
    const ids = applications.map((a) => a.id);
    await this.userNotificationsService.markAsRead(ids);
    const paginated = paginate(applications, page, count);
    return paginated;
  }

  @IsAuthenticated()
  @ApiCookieAuth()
  @Patch('/notifications/preferences')
  async notificationPreferences(@CurrentUser() user: User, @Body() body: any) {
    let preferences: NotificationPreferences;
    const { notificationPreferences: _preferences } =
      await this.usersService.findById(user.id, {
        notificationPreferences: true,
      });
    if (_preferences) {
      preferences = await this.notificationPreferencesService.findByIdAndUpdate(
        _preferences.id,
        body,
      );
    } else {
      preferences = await this.notificationPreferencesService.create(body);
      await this.usersService.findByIdAndUpdate(user.id, {
        notificationPreferences: preferences,
      });
    }
    return preferences;
  }

  @IsAuthenticated()
  @ApiCookieAuth()
  @Get('/notifications/preferences')
  async getNotificationPreferences(@CurrentUser() user: User) {
    const { notificationPreferences } = await this.usersService.findById(
      user.id,
      {
        notificationPreferences: true,
      },
    );
    return notificationPreferences;
  }

  @IsAuthenticated()
  @ApiCookieAuth()
  @Get('verify-email')
  async verifyEmail(@CurrentUser() user: User) {
    // Check if already verified
    const isAlreadyVerified = (await this.getCurrentUser(user)).emailVerified;

    if (isAlreadyVerified)
      throw new ConflictException(errors.users.ALREADY_VERIFIED);
    await this.emailService.sendUserEmailVerification({ user });
  }

  @IsAuthenticated()
  @ApiCookieAuth()
  @Post('verify-email')
  async verifyEmailToken(
    @Body() body: { token: string },
    @CurrentUser() user: User,
  ) {
    const { payload, expired } = validateJsonWebToken(body.token);
    console.log(payload, expired);
    if (expired) throw new BadRequestException(errors.users.EXPIRED_TOKEN);
    if (payload.scope !== 'email-verification')
      throw new BadRequestException(errors.users.INVALID_SCOPE);
    if (payload.context !== 'user')
      throw new BadRequestException(errors.users.INVALID_CONTEXT);
    if (payload.userId !== user.id)
      throw new BadRequestException(errors.users.BAD_EMAIL_VERIFICATION);

    await this.usersService.findByIdAndUpdate(user.id, {
      emailVerified: true,
    });
  }

  @IsAuthenticated()
  @ApiCookieAuth()
  @ApiSecurity('API Key')
  @Post('/token')
  async exchangeSingleUseTokenForAccessToken(@Body('token') token: string) {
    const { payload, expired } = validateJsonWebToken(token);
    if (!payload || expired) throw new BadRequestException();
    if (payload.scope !== 'temporary-auth') throw new ForbiddenException();
    const accessToken = createJsonWebToken(
      {
        applicationId: payload.applicationId,
        scope: 'flow-user-access-token',
      },
      '1y',
    );
    return { accessToken };
  }
}
