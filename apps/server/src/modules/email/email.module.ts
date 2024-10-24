import { Module, forwardRef } from '@nestjs/common';
import { EmailService } from './email.service';
import { ApplicationsModule } from '../applications/applications.module';
import { CredentialIssuanceModule } from '../credential-issuance/credential-issuance.module';

@Module({
    imports: [forwardRef(() => ApplicationsModule), CredentialIssuanceModule],
    providers: [EmailService],
    exports: [EmailService],
})
export class EmailModule {}
