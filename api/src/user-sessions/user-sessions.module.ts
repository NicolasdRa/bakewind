import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { UserSessionsService } from './user-sessions.service';

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [UserSessionsService],
  exports: [UserSessionsService],
})
export class UserSessionsModule {}