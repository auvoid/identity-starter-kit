import { forwardRef, Module } from '@nestjs/common';
import { Oid4vcController } from './oid4vc.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CredOffer, SiopOffer } from '../../entities';
import { SiopOfferService } from './siopOffer.service';
import { CredOfferService } from './credOffer.service';
import { DidsModule } from '../dids/dids.module';
import { ApplicationsModule } from '../applications/applications.module';
import { UsersModule } from '../users/users.module';
import { TemplatesModule } from '../templates/templates.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([SiopOffer, CredOffer]),
        DidsModule,
        forwardRef(() => ApplicationsModule),
        forwardRef(() => UsersModule),
        TemplatesModule,
    ],
    controllers: [Oid4vcController],
    providers: [SiopOfferService, CredOfferService],
    exports: [SiopOfferService, CredOfferService],
})
export class Oid4vcModule {}
