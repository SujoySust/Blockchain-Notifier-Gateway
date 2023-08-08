import { Type } from '@nestjs/common';
import { AuthServiceInterface } from '../app/modules/auth/auth.interface';
import { AuthenticatableInterface } from '../libs/auth/authenticatable.interface';

export interface AppConfig {
  timeZone: string;
  port: number;
  env: string;
  emailVerificationEnabled: boolean;
  sentryDsn: string;
}
interface AuthProvider {
  model: AuthenticatableInterface;
  service: Type<AuthServiceInterface>;
}

export interface AuthConfig {
  default: string;
  providers: {
    [key: string]: AuthProvider;
  };
}

export interface SecurityConfig {
  expiresIn: string;
  refreshIn: string;
  bcryptSaltOrRound: string | number;
  accessSecret: string;
  refreshSecret: string;
}
export interface CorsConfig {
  enabled: boolean;
}
