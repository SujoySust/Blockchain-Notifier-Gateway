import { Module } from '@nestjs/common';
import { AuthLibraryModule } from '../../../libs/auth/auth.library.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [AuthLibraryModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
