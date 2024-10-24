import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    Notification,
    NotificationPreferences,
    Session,
    User,
} from '../../entities';
import { SessionsService } from './sessions.service';
import { OrganizationModule } from '../organization/organization.module';
import { NotificationPreferencesService } from './notification-preference.service';
import { UserNotificationsService } from './user-notifications.service';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Session,
            Notification,
            NotificationPreferences,
        ]),
        forwardRef(() => OrganizationModule),
        EmailModule,
    ],
    controllers: [UsersController],
    providers: [
        UsersService,
        SessionsService,
        UserNotificationsService,
        NotificationPreferencesService,
    ],
    exports: [
        UsersService,
        SessionsService,
        UserNotificationsService,
        NotificationPreferencesService,
    ],
})
export class UsersModule {}
