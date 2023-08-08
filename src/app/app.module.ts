import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { WalletModule } from './modules/wallet/wallet.module';

@Module({
  imports: [AuthModule, WalletModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
