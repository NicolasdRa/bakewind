import { Module, forwardRef } from '@nestjs/common';
import { InternalOrdersController } from './internal-orders.controller';
import { InternalOrdersService } from './internal-orders.service';
import { DatabaseModule } from '../database/database.module';
import { OrderLocksModule } from '../order-locks/order-locks.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [DatabaseModule, OrderLocksModule, forwardRef(() => RealtimeModule)],
  controllers: [InternalOrdersController],
  providers: [InternalOrdersService],
  exports: [InternalOrdersService],
})
export class InternalOrdersModule {}
