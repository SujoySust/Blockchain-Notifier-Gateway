import { NetworkModel } from 'src/app/models/db/network.model';
import { NetworkServiceInterface, NodeWallet } from '../coin_gateway.interface';

import * as btc from '@dip1059/bitcoin';
import * as bitcoin from 'bitcoinjs-lib';
import { addNumbers, parseUrlAndGetRPCopts } from 'src/app/helpers/functions';
import { NETWORK_SLUG } from 'src/app/helpers/network_&_coin_constants';

import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { REGEX } from 'src/app/helpers/coreconstant';
import { BtcBlockTx, BtcNodeUtxos, BtcRawTx, BtcVout } from './btc.types';

export class BTCNetworkService implements NetworkServiceInterface {
  client: btc.Client;
  private btcNetwork: bitcoin.networks.Network;

  async init(network: NetworkModel) {
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

  async getBalanceFromNode(address: string): Promise<number> {
    const utxos: BtcNodeUtxos = await this.client['cmd'](
      'scantxoutset',
      'start',
      [`addr(${address})`],
    );
    return utxos.total_amount;
  }

  async getUtxos(address: string): Promise<BtcNodeUtxos> {
    const utxos: BtcNodeUtxos = await this.client['cmd'](
      'scantxoutset',
      'start',
      [`addr(${address})`],
    );
    return utxos;
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

  async getBlockNumber(): Promise<string | number> {
    return await this.client.getBlockCount();
  }

  async getTransaction(
    txHash: string,
    blockNumber?: number,
  ): Promise<BtcRawTx> {
    if (blockNumber == undefined || blockNumber == null) {
      throw new Error('blockNumber required');
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

  async getConfirmedTransaction(
    txHash: string,
    blockNumber: number,
  ): Promise<BtcRawTx> {
    if (blockNumber == undefined || blockNumber == null) {
      throw new Error('blockNumber required');
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
}

export function processVoutValueSumForSameAddress(
  tx: BtcBlockTx | BtcRawTx,
): BtcVout[] {
  const vouts: BtcVout[] = [];
  const voutsToCompare = tx.vout.slice();
  for (let i = 0; i < tx.vout.length; i++) {
    if (!tx.vout[i]) continue;
    let vout: BtcVout;
    for (let j = 0; j < voutsToCompare.length; j++) {
      if (!voutsToCompare[j]) continue;
      if (
        tx.vout[i].scriptPubKey.address ==
        voutsToCompare[j].scriptPubKey.address
      ) {
        if (vout) {
          vout.value = addNumbers(vout.value, voutsToCompare[j].value);
        } else {
          vout = tx.vout[i];
        }
        voutsToCompare[j] = null;
      }
    }
    vout && vouts.push(vout);
  }
  return vouts;
}
