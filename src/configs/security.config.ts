import { registerAs } from '@nestjs/config';
import { SecurityConfig } from './config.interface';

export const JWTConfig = registerAs(
  'security',
  (): SecurityConfig => ({
    expiresIn: process.env.JWT_TOKEN_EXPIRY || '24 hrs', //2m,1d
    refreshIn: '7d',
    bcryptSaltOrRound: 10,
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
  }),
);
