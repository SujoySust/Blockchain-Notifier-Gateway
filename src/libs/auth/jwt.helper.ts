import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthConfig, SecurityConfig } from '../../configs/config.interface';
import { Token } from './dto/refresh_token.input';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ms = require('ms');

export interface JwtPayload {
  authIdentifier: string | number;
  login_secret?: string;
}

@Injectable()
export class JwtHelper {
  private authConfig: AuthConfig;
  private securityConfig: SecurityConfig;
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.authConfig = this.configService.get<AuthConfig>('auth');
    this.securityConfig = this.configService.get<SecurityConfig>('security');
  }

  generateToken(payload: JwtPayload, authProvider?: string): Token {
    authProvider = authProvider || this.authConfig.default;
    const expireIn = new Date(
      new Date().valueOf() + ms(this.securityConfig.expiresIn),
    );
    return {
      accessToken: this.jwtService.sign(
        { ...payload, provider: authProvider },
        {
          secret: this.securityConfig.accessSecret,
          expiresIn: this.securityConfig.expiresIn,
        },
      ),
      refreshToken: this.jwtService.sign(
        { ...payload, provider: authProvider },
        {
          secret: this.securityConfig.refreshSecret,
          expiresIn: this.securityConfig.expiresIn,
        },
      ),
      expireAt: expireIn,
    };
  }

  authIdentifierFromToken(token: string) {
    const tokenData = this.jwtService.decode(token);
    return {
      authIdentifier: tokenData['authIdentifier'],
      provider: tokenData['provider'],
      access_token: token,
    };
  }

  decodeToken(token: string) {
    return this.jwtService.decode(token);
  }

  refreshToken(token: string) {
    try {
      const { authIdentifier, login_secret, provider } = this.jwtService.verify(
        token,
        {
          secret: this.securityConfig.refreshSecret,
        },
      );
      return this.generateToken({ authIdentifier, login_secret }, provider);
    } catch (e) {
      console.error(e.stack);
      throw new UnauthorizedException();
    }
  }
}
