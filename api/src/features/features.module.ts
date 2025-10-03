import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SoftwareFeaturesService } from './software-features.service';

@Module({
  imports: [DatabaseModule],
  providers: [SoftwareFeaturesService],
  exports: [SoftwareFeaturesService],
})
export class FeaturesModule {}
