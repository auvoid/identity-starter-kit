import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Challenge, Identity, OrganizationCredential } from '../../entities';
import { DidsService } from './dids.service';
import { DidsController } from './dids.controller';
import { OrganizationModule } from '../organization/organization.module';
import { SslService } from './ssl.service';
import { OrganizationCredentialsService } from './organizationCredentials.service';
import { ChallengesService } from './challenge.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Identity, Challenge, OrganizationCredential]),
        forwardRef(() => OrganizationModule),
    ],
    controllers: [DidsController],
    providers: [
        DidsService,
        SslService,
        OrganizationCredentialsService,
        ChallengesService,
    ],
    exports: [DidsService, ChallengesService],
})
export class DidsModule {}
