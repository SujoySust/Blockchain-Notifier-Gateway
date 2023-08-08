import { ResponseModel } from 'src/app/models/custom/common.response.model';
import { CoinModel } from 'src/app/models/db/coin.model';
import { NetworkModel } from 'src/app/models/db/network.model';
import { Common, Hardfork, ValidChains } from 'web3';

export interface NodeWallet {
  pvkey: string;
  address: string;
}

export interface CoinSendParam {
  from: string;
  to: string;
  amount: number;
  pvkey: string;
}

export interface CoinTxObj {
  txHash: string;
}

export interface FeeEstimationParam {
  from: string;
  to: string;
  amount: number;
}

export interface TransactionConfig {
  from?: string;
  to?: string;
  value?: number | string;
  gas?: number | string;
  gasPrice?: number | string;
  data?: string;
  nonce?: number | bigint;
  chainId?: number;
  common?: Common;
  chain?: ValidChains;
  hardfork?: Hardfork;
}

export interface CoinServiceInterface {
  init(network: NetworkModel, coin: CoinModel): Promise<void>;
  createWallet(): NodeWallet;
  validateAddress(address: string): boolean;
  validateTxHash(txHash: string): boolean;
  getBalance(address: string): Promise<number>;
  getTransaction(txHash: string, blockNumber?: number): Promise<any>;
  sendCoin(data: CoinSendParam): Promise<CoinTxObj>;
  estimateFee(data: FeeEstimationParam): Promise<ResponseModel>;
  getMaxFee(data?: FeeEstimationParam): Promise<number>;
}

export interface NetworkServiceInterface {
  client: any;
  init(network: NetworkModel): Promise<void>;
  createWallet(): NodeWallet;
  validateAddress(address: string): boolean;
  validateTxHash(txHash: string): boolean;
  getTransaction(txHash: string, blockNumber?: number): Promise<any>;
  getConfirmedTransaction(txHash: string, blockNumber?: number): Promise<any>;
  getBlockNumber(): Promise<string | number | bigint>;
}
