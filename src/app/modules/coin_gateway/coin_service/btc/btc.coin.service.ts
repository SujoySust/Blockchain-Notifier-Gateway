import {
  CoinSendParam,
  CoinServiceInterface,
  CoinTxObj,
  FeeEstimationParam,
  NodeWallet,
} from '../coin_gateway.interface';

import * as btc from '@dip1059/bitcoin';
import * as bitcoin from 'bitcoinjs-lib';
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';

import { REGEX } from '../../../../helpers/coreconstant';
import {
  errorResponse,
  parseUrlAndGetRPCopts,
  successResponse,
} from '../../../../helpers/functions';
import { NETWORK_SLUG } from '../../../../helpers/network_&_coin_constants';
import { ResponseModel } from '../../../../models/custom/common.response.model';
import { CoinModel } from '../../../../models/db/coin.model';
import { NetworkModel } from '../../../../models/db/network.model';
import {
  SendBTCPayload,
  estimateFee,
  processAndSendBTC,
} from './btc.coin_send.service';
import { BtcNodeUtxos } from './btc.types';

export class BTCCoinService implements CoinServiceInterface {
  private network: NetworkModel;
  private client: btc.Client;
  private btcNetwork: bitcoin.Network;
  private coin: CoinModel;

  async init(network: NetworkModel, coin: CoinModel) {
    if (!network || !coin || !coin.currency) {
      throw new Error("Netwrok, Coin, Coin Currency can't be empty");
    }
    this.network = network;
    this.coin = coin;
    this.client = new btc.Client(parseUrlAndGetRPCopts(network.rpc_url));
    this.btcNetwork =
      network.slug == NETWORK_SLUG.BTC_MAINNET
        ? bitcoin.networks.bitcoin
        : bitcoin.networks.testnet;
  }
  createWallet(): NodeWallet {
    const ECPair = ECPairFactory(ecc);
    const keyPair = ECPair.makeRandom({
      network: this.btcNetwork,
    });
    const address = bitcoin.payments.p2wpkh({
      network: this.btcNetwork,
      pubkey: keyPair.publicKey,
    }).address;
    return {
      pvkey: keyPair.privateKey.toString('hex'),
      address: address,
    };
  }

  validateAddress(address: string): boolean {
    try {
      bitcoin.address.toOutputScript(address, this.btcNetwork);
      return true;
    } catch (e) {
      return false;
    }
  }

  validateTxHash(txHash: string): boolean {
    return new RegExp(REGEX.BTC_TXID).test(txHash);
  }

  async getBalance(address: string): Promise<number> {
    const utxos: BtcNodeUtxos = await this.client['cmd'](
      'scantxoutset',
      'start',
      [`addr${address}`],
    );
    return utxos.total_amount;
  }

  async getTransaction(txHash: string, blockNumber?: number): Promise<any> {
    if (blockNumber == undefined || blockNumber == null) {
      throw new Error('Block number is required!');
    }
    try {
      const blockHash = await this.client.getBlockHash(blockNumber);
      const txObj = await this.client.getRawTransaction(
        txHash,
        true,
        blockHash,
      );
      return txObj;
    } catch (e) {
      return null;
    }
  }

  async sendCoin(data: CoinSendParam): Promise<CoinTxObj> {
    const payload: SendBTCPayload = {
      client: this.client,
      network: this.network,
      coin: this.coin,
      btcNetwork: this.btcNetwork,
      transaction: {
        from: data.from,
        to: data.to,
        amount: data.amount,
      },
      opts: {
        private_key: data.pvkey,
      },
    };
    const txid = await processAndSendBTC(payload);
    return { txHash: txid };
  }

  async estimateFee(data: FeeEstimationParam): Promise<ResponseModel> {
    const response = await estimateFee(this.network, this.coin, {
      from: data.from,
      to: data.to,
      amount: data.amount,
    });
    if (!response.success) return errorResponse(response.message);
    const estimatedFee = response.data['fee'];
    return successResponse('', {
      fee: estimatedFee,
      fee_coin_id: this.coin.id,
      fee_crypto_id: this.coin.crypto_id,
    });
  }

  async getMaxFee(data?: FeeEstimationParam): Promise<number> {
    if (!data) throw new Error('FeeEstimationParam data required');
    const response = await estimateFee(this.network, this.coin, {
      from: data.from,
      to: data.to,
      amount: data.amount,
    });
    return response.data['fee'];
  }
}
