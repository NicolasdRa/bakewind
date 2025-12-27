import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';
import { StaffModule } from '../staff/staff.module';
import { UserSessionsModule } from '../user-sessions/user-sessions.module';
import { StripeModule } from '../stripe/stripe.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { TenantGuard } from './guards/tenant.guard';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => TenantsModule),
    StaffModule,
    UserSessionsModule,
    StripeModule,
    JwtModule.registerAsync({
      global: true,
      useFactory: async (configService: ConfigService) => {
        const secret = configService.getOrThrow<string>('JWT_SECRET');
        return {
          secret,
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '15m',
          },
        };
      },
      inject: [ConfigService],
    }),
    PassportModule.register({
      defaultStrategy: 'jwt',
      property: 'user',
      session: false,
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, TenantGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, TenantGuard],
})
export class AuthModule {}
