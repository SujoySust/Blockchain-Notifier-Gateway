import * as btc from '@dip1059/bitcoin';

import { NotifierHelperService } from '../notifier_helper.service';
// import { DepositBalanceArgs } from '../../modules/deposit/dto/deposit.input.dto';
// import { processWithdrawalNotified } from '../../modules/withdrawal/withdrawal.service';
import {
  BtcBlock,
  BtcBlockTx,
  BtcVin,
  BtcVout,
} from '../../coin_gateway/coin_service/btc/btc.types';
import {
  CACHE_KEYS,
  NETWORK_BASE_TYPE,
} from '../../../helpers/network_&_coin_constants';
import {
  getUtxo,
  saveUtxo,
  updateUtxo,
} from '../../coin_gateway/coin_service/btc/btc.utxo.service';
import { STATUS_ACTIVE, STATUS_EXPIRED } from '../../../helpers/coreconstant';
import { NetworkModel } from '../../../models/db/network.model';
import { NotifierServiceInterface } from '../notifier.interface';
import { cacheUserWalletAddresses } from '../../../core_services/app_start_task.service';
import { processVoutValueSumForSameAddress } from '../../coin_gateway/coin_service/btc/btc.network.service';
import { prisma_client } from '../../../helpers/functions';
import { ResponseModel } from '../../../models/custom/common.response.model';

export class BTCBaseNetworkNotifier implements NotifierServiceInterface {
  network: NetworkModel;
  notifierHelper: NotifierHelperService;

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
      if (this.network.base_type != NETWORK_BASE_TYPE.BTC) return;
      await this.notifierHelper.coreNotifierProcess(this.network, this);
    } catch (e) {
      console.error(e.stack);
    }
  }

  async fetchBlockAndProcess(
    network: NetworkModel,
    blockNumber: number | string,
    client: btc.Client,
  ) {
    const hash = await client.getBlockHash(blockNumber);
    const block: BtcBlock = await client.getBlock(hash, 2);
    if (!block) throw new Error('skip');
    await this.processBlock(network, block);
  }

  async processBlock(network: NetworkModel, block: BtcBlock) {
    const userAddresses = await this.notifierHelper.fetchNetworkCacheData(
      network,
      CACHE_KEYS.WALLET_ADDRESSES,
      cacheUserWalletAddresses,
    );
    // const withdrawalTxIds = await this.notifierHelper.fetchNetworkCacheData(
    //   network,
    //   CACHE_KEYS.WITHDRAWAL_TXIDS,
    //   cacheWithdrawalTxIDsForNetwork,
    // );

    for (let i = 0; i < block.tx.length; i++) {
      const tx = block.tx[i];
      if (!tx || !tx.txid) continue;
      await this.processDeposit(userAddresses, network, tx, block.height);
      await this.processUtxoDeposit(userAddresses, network, tx, block.height);

      // await this.processWithdrawal(withdrawalTxIds, network, tx, block.height);
    }
  }

  /***
   * Deposit Related Processings *
   ***/
  async processDeposit(
    userAddresses: string[],
    network: NetworkModel,
    tx: BtcBlockTx,
    blockNumber: string | number,
  ) {
    const vouts = processVoutValueSumForSameAddress(tx);

    for (let j = 0; j < vouts.length; j++) {
      const vout = vouts[j];
      let depositFound: boolean;
      for (let k = 0; k < userAddresses.length; k++) {
        depositFound = await this.processForDepositFind(
          network,
          userAddresses[k],
          tx,
          blockNumber,
          vout,
        );
        if (depositFound) break;
      }
    }
  }

  async processForDepositFind(
    network: NetworkModel,
    address: string,
    tx: BtcBlockTx,
    blockNumber: number | string,
    vout: BtcVout,
  ): Promise<boolean> {
    const voutAddress = vout.scriptPubKey?.address;
    if (
      voutAddress &&
      voutAddress.toLowerCase() == address.toLowerCase() &&
      vout.value > 0
    ) {
      console.log(tx);
      // const depositArgsData: DepositBalanceArgs = {
      //   txid: tx.txid,
      //   crypto_code: network.native_currency,
      //   amount: vout.value,
      //   address: address,
      //   block_number: blockNumber,
      //   network: network,
      // };

      // await this.finishDepositProcess(depositArgsData, blockNumber, tx.vin[0]);
      return true;
    }
    return false;
  }

  // async finishDepositProcess(
  //   depositArgsData: DepositBalanceArgs,
  //   blockNumber: string | number,
  //   firstVin: BtcVin,
  // ): Promise<ResponseModel> {
  //   let response: ResponseModel;
  //   if (await this.isChangeDepositAfterWithdrawal(firstVin)) {
  //     console.log(
  //       `vin_info: txid=${firstVin.txid} vout_index=${firstVin.vout}  block=${blockNumber}`,
  //     );
  //     console.log(`CHANGE_BALANCE_DEPOSIT: block=${blockNumber}`);
  //   } else {
  //     console.log(`ACTUAL_DEPOSIT: block=${blockNumber}`);
  //     // response = await new DepositService().depositBalanceForUser(
  //     //   depositArgsData,
  //     // );
  //     // if (!response.success) {
  //     //   console.log(
  //     //     `deposit_service_response: ${JSON.stringify(response.message)}`,
  //     //   );
  //     // }
  //   }

  //   console.log(
  //     `deposit_found: txid=${depositArgsData.txid} block=${blockNumber}`,
  //   );
  //   console.log(
  //     `deposit_info: ${depositArgsData.address} <- ${depositArgsData.amount} ${depositArgsData.crypto_code}  block=${blockNumber}`,
  //   );
  //   console.log(`DEPOSIT_MATCHED_FOR:  block=${blockNumber}`);
  //   console.log('\n');
  //   return response;
  // }

  async isChangeDepositAfterWithdrawal(vin: BtcVin) {
    if (!vin || !vin.txid || vin.vout == undefined) return false;
    const utxo = await prisma_client.btcUtxo.findFirst({
      where: {
        txid: {
          equals: vin.txid,
          mode: 'insensitive',
        },
        vout: vin.vout,
      },
    });
    if (utxo) return true;
    else return false;
  }

  /***
   * Utxo Deposit Related Processings *
   ***/
  async processUtxoDeposit(
    userAddresses: string[],
    network: NetworkModel,
    tx: BtcBlockTx,
    blockNumber: string | number,
  ) {
    for (let j = 0; j < tx.vout.length; j++) {
      const vout = tx.vout[j];
      let matchFound: boolean;
      //for user
      for (let k = 0; k < userAddresses.length; k++) {
        matchFound = await this.processForUtxoDepositFind(
          network,
          userAddresses[k],
          tx.txid,
          blockNumber,
          vout,
        );
        if (matchFound) break;
      }
    }
  }

  async processForUtxoDepositFind(
    network: NetworkModel,
    address: string,
    txid: string,
    blockNumber: number | string,
    vout: BtcVout,
  ): Promise<boolean> {
    const voutAddress = vout.scriptPubKey?.address;
    if (
      voutAddress &&
      voutAddress.toLowerCase() == address.toLowerCase() &&
      vout.value > 0
    ) {
      await saveUtxo(network, address, {
        txid: txid,
        vout_index: vout.n,
        amount: vout.value,
        block_number: blockNumber.toString(),
      });
      return true;
    }
    return false;
  }

  /***
   * Withdrawal Related Processings *
   ***/
  async processWithdrawal(
    withdrawalTxIds: string[],
    network: NetworkModel,
    tx: BtcBlockTx,
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
    await this.processUtxoWithdrawal(network, tx, blockNumber);
    // } catch (e) {
    //   this.logger.write(e.stack, LOG_LEVEL_ERROR);
    // }
  }

  async processForWithdrawalFind(
    withdrawalTxId: string,
    network: NetworkModel,
    tx: BtcBlockTx,
    blockNumber: number | string,
  ): Promise<boolean> {
    if (tx.txid.toLowerCase() == withdrawalTxId.toLowerCase()) {
      // await processWithdrawalNotified(withdrawalTxId, network, blockNumber);
      return true;
    }
    return false;
  }

  async processUtxoWithdrawal(
    network: NetworkModel,
    tx: BtcBlockTx,
    blockNumber: number | string,
  ) {
    for (let j = 0; j < tx.vin.length; j++) {
      const vin = tx.vin[j];
      await this.processForUtxoWithdrawalFind(network, tx, blockNumber, vin);
    }
  }

  async processForUtxoWithdrawalFind(
    network: NetworkModel,
    tx: BtcBlockTx,
    blockNumber: number | string,
    vin: BtcVin,
  ) {
    if (!vin) console.log('tx: ', JSON.stringify(tx));
    if (!vin.txid || vin.vout == undefined) {
      return;
    }

    const utxo = await getUtxo(network, vin.txid, vin.vout);
    if (utxo) {
      console.log(`withdrawal_found: txid=${tx.txid} block=${blockNumber}`);
      console.log(
        `withdrawal_vin_info: txid=${vin.txid} vout_index=${vin.vout}  block=${blockNumber}`,
      );
      console.log(`WITHDRAWAL_MATCHED_FOR:  block=${blockNumber}`);

      if (utxo.status == STATUS_ACTIVE) {
        await updateUtxo(utxo, { status: STATUS_EXPIRED });
      }
    }
  }
}
