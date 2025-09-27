import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string) {
    console.log('🔍 LocalStrategy.validate called with:', {
      email,
      password: '***',
    });
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      console.log('❌ LocalStrategy validation failed for:', email);
      throw new UnauthorizedException('Invalid credentials');
    }
    console.log('✅ LocalStrategy validation successful for:', email);
    return user;
  }
}
