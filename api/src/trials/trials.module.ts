import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { TrialAccountsService } from './trial-accounts.service';
import { TrialsController } from './trials.controller';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [TrialsController],
  providers: [TrialAccountsService],
  exports: [TrialAccountsService],
})
export class TrialsModule {}

// Also export as TrialAccountsModule for backward compatibility
export { TrialsModule as TrialAccountsModule };
