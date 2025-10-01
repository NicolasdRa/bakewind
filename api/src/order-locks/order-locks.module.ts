import { Module } from '@nestjs/common';
import { OrderLocksController } from './order-locks.controller';
import { OrderLocksService } from './order-locks.service';
import { RedisConfigService } from '../config/redis.config';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [OrderLocksController],
  providers: [OrderLocksService, RedisConfigService],
  exports: [OrderLocksService],
})
export class OrderLocksModule {}
