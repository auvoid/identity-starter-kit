import { Module, forwardRef } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application, StepAction } from '../../entities';
import { ApplicationsController } from './applications.controller';
import { TemplatesModule } from '../templates/templates.module';
import { CredentialIssuanceModule } from '../credential-issuance/credential-issuance.module';
import { EmailModule } from '../email/email.module';
import { DidsModule } from '../dids/dids.module';
import { Oid4vcModule } from '../oid4vc/oid4vc.module';
import { StepActionsService } from './stepActions.service';
import { ExtensionsModule } from '../extensions/extensions.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Application, StepAction]),
        forwardRef(() => TemplatesModule),
        forwardRef(() => CredentialIssuanceModule),
        forwardRef(() => EmailModule),
        forwardRef(() => Oid4vcModule),
        forwardRef(() => DidsModule),
        ExtensionsModule.register(),
    ],
    providers: [ApplicationsService, StepActionsService],
    exports: [ApplicationsService, StepActionsService],
    controllers: [ApplicationsController],
})
export class ApplicationsModule {}
