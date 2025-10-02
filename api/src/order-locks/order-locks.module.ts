import { Module, forwardRef } from '@nestjs/common';
import { OrderLocksController } from './order-locks.controller';
import { OrderLocksService } from './order-locks.service';
import { RedisConfigService } from '../config/redis.config';
import { DatabaseModule } from '../database/database.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => RealtimeModule)],
  controllers: [OrderLocksController],
  providers: [OrderLocksService, RedisConfigService],
  exports: [OrderLocksService],
})
export class OrderLocksModule {}
