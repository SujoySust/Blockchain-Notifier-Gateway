/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
import { NETWORK_BASE_TYPE } from '../helpers/network_&_coin_constants';
import { NetworkModel } from '../models/db/network.model';
import { BTCNetworkService } from '../modules/coin_gateway/coin_service/btc/btc.network.service';
import { NetworkServiceInterface, NodeWallet } from '../modules/coin_gateway/coin_service/coin_gateway.interface';
import { ETHNetworkService } from '../modules/coin_gateway/coin_service/eth/eth.network.service';

export const NETWORK_BASE_TYPE_SERVICE = {
  [NETWORK_BASE_TYPE.BTC]: BTCNetworkService,
  [NETWORK_BASE_TYPE.ETH]: ETHNetworkService,
};


export class NetworkGatewayService implements NetworkServiceInterface{
  private network: NetworkModel;
  private networkService: NetworkServiceInterface;
  client: any;

  async init(network: NetworkModel) {
    if (!network) {
      throw new Error("Netwrok can't be empty");
    }
    this.network = network;
    const service = NETWORK_BASE_TYPE_SERVICE[this.network.base_type];
    if (!service) throw new Error(`No service found. Invalid network base_type: ${this.network.base_type}`);
    this.networkService = new service();
    await this.networkService.init(this.network);
    this.client = this.networkService.client;
  }

  createWallet(): NodeWallet {
    return this.networkService.createWallet();
  }

  validateAddress(address: string): boolean {
    return this.networkService.validateAddress(address);
  }
  
  validateTxHash(address: string): boolean {
    return this.networkService.validateTxHash(address);
  }

  async getTransaction(txHash: string, blockNumber?: number): Promise<any> {
    return await this.networkService.getTransaction(txHash, blockNumber);
  }

  async getConfirmedTransaction(txHash: string, blockNumber?: number): Promise<any> {
    return await this.networkService.getConfirmedTransaction(txHash, blockNumber);
  }
  
  async getBlockNumber(): Promise<number | string | bigint> {
    return await this.networkService.getBlockNumber();
  }
}