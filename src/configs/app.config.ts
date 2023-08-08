import { AppConfig as AppConfigInterface } from './config.interface';
import { registerAs } from '@nestjs/config';

export const AppConfig = registerAs(
  'app',
  (): AppConfigInterface => ({
    port: Number(process.env.APP_PORT) || 3000,
    timeZone: process.env.TZ || 'Asia/Dhaka',
    env: process.env.APP_ENV,
    emailVerificationEnabled: true,
    sentryDsn: process.env.SENTRY_DSN || '',
  }),
);
