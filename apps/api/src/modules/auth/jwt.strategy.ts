import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { env } from '../../core/config/env.js';
import { AuthService } from './auth.service.js';
import type { AuthUser, Role } from '@nutrigon/contracts';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  branchId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.authService.validateUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists or is inactive');
    }
    return user;
  }
}
