import { Module, Global, forwardRef } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { DatabaseModule } from '../database/database.module';
import { StaffModule } from '../staff/staff.module';
import { UsersModule } from '../users/users.module';

@Global()
@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => StaffModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
