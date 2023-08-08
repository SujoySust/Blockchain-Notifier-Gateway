import { JwtDto } from './dto/jwt.dto';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Type, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthConfig, SecurityConfig } from '../../configs/config.interface';
import { ModuleRef } from '@nestjs/core';
import { AuthServiceInterface } from '../../app/modules/auth/auth.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly securityConfig: SecurityConfig;
  private readonly authConfig: AuthConfig;
  constructor(
    private readonly moduleRef: ModuleRef,
    readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<SecurityConfig>('security').accessSecret,
    });
    this.securityConfig = configService.get<SecurityConfig>('security');
    this.authConfig = configService.get<AuthConfig>('auth');
  }

  async validate(payload: JwtDto): Promise<any> {
    const authIdentifier = payload.authIdentifier;
    const provider = await this.getAuthServiceByProvider(payload.provider);
    try {
      const login_secret = payload.login_secret;
      const user = await provider.getUserByIdentifier(
        authIdentifier,
        login_secret,
      );
      return { user, provider: payload.provider };
    } catch (e) {
      console.error(e.stack);
      throw new UnauthorizedException();
    }
  }

  async getAuthServiceByProvider(
    authProvider?: string,
  ): Promise<AuthServiceInterface> {
    authProvider = authProvider || this.authConfig.default;
    const provider = this.authConfig.providers[authProvider];
    return await this.resolveAuthService(provider.service);
  }

  private async resolveAuthService(service: Type<AuthServiceInterface>) {
    return this.moduleRef.create(service);
  }
}
