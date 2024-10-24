import { Injectable } from '@nestjs/common';
import { UserNotificationsService } from '../modules/users/user-notifications.service';
import { Application } from '../entities';
import { NotificationType } from '@repo/dtos';
import { OrganizationService } from '../modules/organization/organization.service';

@Injectable()
export class NotificationsService {
  constructor(
    private notificationsService: UserNotificationsService,
    private organizationsService: OrganizationService,
  ) {}

  async applicationCreatedNotification(application: Application) {
    if (!application.user)
      throw new Error('requires template and user or user email');
    const users = [application.user];
    const notifications = users
      .map((u) => {
        if (u.notificationPreferences && !u.notificationPreferences.credential)
          return null;
        return {
          userSubject: u,
          application,
          userTarget: application.user,
          type: 'APPLICATION_CREATED' as NotificationType,
        };
      })
      .filter((n) => !!n);
    await this.notificationsService.createBulk(notifications);
  }
}
