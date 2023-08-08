/* eslint-disable @typescript-eslint/no-var-requires */
import Web3 from 'web3';
import { NotifierHelperService } from '../notifier_helper.service';
import {
  convertCoinAmountFromInt,
  multiplyNumbers,
  prisma_client,
} from '../../../helpers/functions';
import {
  CACHE_KEYS,
  NETWORK_BASE_TYPE,
} from '../../../helpers/network_&_coin_constants';
import { BlockTransactionObject } from 'web3-eth';
import { Transaction } from 'web3-core';

import { ETHTokenNotifier } from './eth_token.notifier';
import { NetworkModel } from '../../../models/db/network.model';
import { NotifierServiceInterface } from '../notifier.interface';
import {
  cacheTokenContractAddresses,
  cacheUserWalletAddresses,
} from '../../../core_services/app_start_task.service';

const web3 = require('web3');

export class ETHBaseNetworkNotifier implements NotifierServiceInterface {
  network: NetworkModel;
  notifierHelper: NotifierHelperService;
  private tokenNotifier: ETHTokenNotifier;

  async init(network: NetworkModel) {
    try {
      network.native_crypto = await prisma_client.cryptoCurrency.findUnique({
        where: { code: network.native_currency },
      });
      this.network = network;
      const notifierHelper = new NotifierHelperService();
      this.notifierHelper = notifierHelper;
    } catch (e) {
      console.error(e.stack);
    }
  }

  async startNotifier() {
    try {
      if (this.network.base_type != NETWORK_BASE_TYPE.ETH) return;
      await this.notifierHelper.coreNotifierProcess(this.network, this);
    } catch (e) {
      console.error(e.stack);
    }
  }

  async fetchBlockAndProcess(
    network: NetworkModel,
    blockNumber: number,
    client: Web3,
  ) {
    this.tokenNotifier = new ETHTokenNotifier(this);
    const block = await client.eth.getBlock(blockNumber, true);
    if (!block) throw new Error('skip');
    await this.processBlock(network, block, client);
  }

  async processBlock(
    network: NetworkModel,
    block: BlockTransactionObject,
    client: Web3,
  ) {
    const userAddresses = await this.notifierHelper.fetchNetworkCacheData(
      network,
      CACHE_KEYS.WALLET_ADDRESSES,
      cacheUserWalletAddresses,
    );

    const tokenAddressesData = await this.notifierHelper.fetchNetworkCacheData(
      network,
      CACHE_KEYS.TOKEN_ADDRESSES,
      cacheTokenContractAddresses,
    );

    const matchedTokensData = [];

    for (let i = 0; i < block.transactions.length; i++) {
      const tx = block.transactions[i];
      if (!tx || !tx.hash || !tx.to) continue;

      const tokenData = await this.tokenNotifier.getMatchedToken(
        tx,
        tokenAddressesData,
      );
      if (tokenData && !matchedTokensData.includes(tokenData)) {
        matchedTokensData.push(tokenData);
      } else {
        await this.processDeposit(userAddresses, network, tx, block.number);
      }
      // await this.processWithdrawal(withdrawalTxIds, network, tx, block.number);
    }

    await this.tokenNotifier.processBlockForTokens(
      network,
      matchedTokensData,
      userAddresses,
      block.number,
      client,
    );
  }

  async processDeposit(
    userAddresses: string[],
    network: NetworkModel,
    tx: Transaction,
    blockNumber: string | number,
  ): Promise<boolean> {
    //for user
    for (let k = 0; k < userAddresses.length; k++) {
      const depositFound = await this.processForDepositFind(
        network,
        userAddresses[k],
        tx,
        blockNumber,
      );
      if (depositFound) return true;
    }
  }

  async processForDepositFind(
    network: NetworkModel,
    address: string,
    tx: Transaction,
    blockNumber: number | string,
  ): Promise<boolean> {
    const toAddress = tx.to;
    if (
      toAddress &&
      toAddress.toLowerCase() == address.toLowerCase() &&
      Number(tx.value) > 0
    ) {
      const amount = convertCoinAmountFromInt(
        tx.value,
        network.native_crypto.decimal,
      );
      const depositArgsData = {
        txid: tx.hash,
        crypto_code: network.native_currency,
        amount: amount,
        address: address,
        block_number: blockNumber,
        network: network,
      };

      console.log(depositArgsData);
      return true;
    }
    return false;
  }

  async processWithdrawal(
    withdrawalTxIds: string[],
    network: NetworkModel,
    tx: Transaction,
    blockNumber: number | string,
  ) {
    // try {
    for (let i = 0; i < withdrawalTxIds.length; i++) {
      const found = await this.processForWithdrawalFind(
        withdrawalTxIds[i],
        network,
        tx,
        blockNumber,
      );
      if (found) break;
    }
    // } catch (e) {
    //   this.logger.write(e.stack, LOG_LEVEL_ERROR);
    // }
  }

  async processForWithdrawalFind(
    withdrawalTxId: string,
    network: NetworkModel,
    tx: Transaction,
    blockNumber: number | string,
  ): Promise<boolean> {
    if (tx.hash.toLowerCase() == withdrawalTxId.toLowerCase()) {
      const client: Web3 = new web3(network.rpc_url);
      const txReceipt = await client.eth.getTransactionReceipt(withdrawalTxId);
      if (!txReceipt.status) return true;

      const gasPriceInWei = client.utils.toDecimal(
        txReceipt['effectiveGasPrice'],
      );
      const gasPriceInNative = convertCoinAmountFromInt(
        gasPriceInWei,
        network.native_crypto.decimal,
      );
      const fee = multiplyNumbers(txReceipt.gasUsed, Number(gasPriceInNative));

      // await processWithdrawalNotified(
      //   withdrawalTxId,
      //   network,
      //   blockNumber,
      //   fee,
      // );
      return true;
    }
    return false;
  }
}
