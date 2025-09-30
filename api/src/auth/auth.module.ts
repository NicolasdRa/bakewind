import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SaasAuthController } from './controllers/saas-auth.controller';
import { UsersModule } from '../users/users.module';
import { SaasUsersModule } from '../saas-users/saas-users.module';
import { TrialsModule } from '../trials/trials.module';
import { UserSessionsModule } from '../user-sessions/user-sessions.module';
import { StripeModule } from '../stripe/stripe.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    UsersModule,
    SaasUsersModule,
    TrialsModule,
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
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController, SaasAuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
