import { Global, Module } from '@nestjs/common';
import { IdentityService } from '../../services/identity.service';
import { OrganizationModule } from '../organization/organization.module';
import { DidsModule } from '../dids/dids.module';
import { NotificationsService } from '../../services/notification.service';
import { UsersModule } from '../users/users.module';

@Global()
@Module({
    imports: [OrganizationModule, DidsModule, UsersModule, OrganizationModule],
    providers: [IdentityService, NotificationsService],
    exports: [IdentityService, NotificationsService],
    controllers: [],
})
export class GlobalModule {}
