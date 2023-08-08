import {
  COIN_TYPE,
  NETWORK_BASE_TYPE,
} from '../../../helpers/network_&_coin_constants';
import { ResponseModel } from '../../../models/custom/common.response.model';
import { CoinModel } from '../../../models/db/coin.model';
import { NetworkModel } from '../../../models/db/network.model';
import { BTCCoinService } from './btc/btc.coin.service';
import {
  CoinSendParam,
  CoinServiceInterface,
  CoinTxObj,
  FeeEstimationParam,
  NodeWallet,
} from './coin_gateway.interface';

// import { BTCCoinService } from './btc/btc.network.service';
import { ETHCoinService } from './eth/eth.service';
import { ERC20TokenService } from './eth/eth_token.service';

export const COIN_NETWORK_BASE_TYPE_SERVICE = {
  [NETWORK_BASE_TYPE.BTC]: {
    [COIN_TYPE.NATIVE]: BTCCoinService,
  },
  [NETWORK_BASE_TYPE.ETH]: {
    [COIN_TYPE.NATIVE]: ETHCoinService,
    [COIN_TYPE.TOKEN]: ERC20TokenService,
  },
};
export class CoinGatewayService implements CoinServiceInterface {
  private network: NetworkModel;
  private coin: CoinModel;
  private coinService: CoinServiceInterface;

  async init(network: NetworkModel, coin: CoinModel) {
    if (!network || !coin || !coin.currency) {
      throw new Error("Network, coin, coin currency can't be empty");
    }
    this.network = network;
    this.coin = coin;
    const service =
      COIN_NETWORK_BASE_TYPE_SERVICE[this.network.base_type][this.coin.type];
    if (!service) {
      throw new Error(
        `No services found. Invalid network base type: ${this.network.base_type} or coin type: ${this.coin.type}`,
      );
    }
    this.coinService = new service();
    await this.coinService.init(this.network, this.coin);
  }

  createWallet(): NodeWallet {
    return this.coinService.createWallet();
  }

  validateAddress(address: string): boolean {
    return this.coinService.validateAddress(address);
  }

  validateTxHash(txHash: string): boolean {
    return this.coinService.validateTxHash(txHash);
  }

  getBalance(address: string): Promise<number> {
    return this.coinService.getBalance(address);
  }

  getTransaction(txHash: string, blockNumber?: number): Promise<any> {
    return this.coinService.getTransaction(txHash, blockNumber);
  }

  sendCoin(data: CoinSendParam): Promise<CoinTxObj> {
    return this.coinService.sendCoin(data);
  }

  estimateFee(data: FeeEstimationParam): Promise<ResponseModel> {
    return this.coinService.estimateFee(data);
  }

  getMaxFee(data?: FeeEstimationParam): Promise<number> {
    return this.coinService.getMaxFee(data);
  }
}
