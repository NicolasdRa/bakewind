import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { SaasUsersService } from './saas-users.service';

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [SaasUsersService],
  exports: [SaasUsersService],
})
export class SaasUsersModule {}
