import { Global, Module } from '@nestjs/common';
import { ResponseFormattingService } from './services/response-formatting.service';

import { DatabaseModule } from '../database/database.module';

/**
 * Common Module providing application-wide utilities and services
 * This module is marked as @Global() so its providers are available
 * throughout the application without needing to import it in each module
 */
@Global()
@Module({
  imports: [DatabaseModule],
  providers: [ResponseFormattingService],
  exports: [ResponseFormattingService],
})
export class CommonModule {}
