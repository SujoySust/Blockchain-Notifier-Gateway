import { Module } from '@nestjs/common';
import { BTCCoinService } from './coin_service/btc/btc.coin.service';
import { CoinGatewayService } from './coin_service/coin_gateway.service';
import { ETHCoinService } from './coin_service/eth/eth.service';
import { ERC20TokenService } from './coin_service/eth/eth_token.service';

@Module({
  imports: [],
  providers: [
    ETHCoinService,
    BTCCoinService,
    ERC20TokenService,
    CoinGatewayService,
  ],
  exports: [],
})
export class CoinGatewayModule {}
