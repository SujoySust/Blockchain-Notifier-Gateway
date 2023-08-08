import { registerAs } from '@nestjs/config';
import { User } from '../app/models/db/user.model';
import { AuthService } from '../app/modules/auth/auth.service';
import { AuthConfig as AuthConfigInterface } from './config.interface';

export const AuthConfig = registerAs(
  'auth',
  (): AuthConfigInterface => ({
    default: 'user',
    providers: {
      user: {
        model: User,
        service: AuthService,
      },
    },
  }),
);
