import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './db/data-source';
import { UsersModule } from './modules/users/users.module';
import { Oid4vcModule } from './modules/oid4vc/oid4vc.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    UsersModule,
    Oid4vcModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
