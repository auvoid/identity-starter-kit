import { Module, forwardRef } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '../../entities';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';
import { CredentialIssuanceModule } from '../credential-issuance/credential-issuance.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Organization]),
        forwardRef(() => UsersModule),
        forwardRef(() => EmailModule),
        CredentialIssuanceModule,
    ],
    providers: [OrganizationService],
    controllers: [OrganizationController],
    exports: [OrganizationService],
})
export class OrganizationModule {}
