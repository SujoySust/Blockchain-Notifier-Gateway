import { CorsConfig as CorsConfigInterface } from './config.interface';
import { registerAs } from '@nestjs/config';

export const CorsConfig = registerAs(
  'cors',
  (): CorsConfigInterface => ({
    enabled: true,
  }),
);
