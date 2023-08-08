import { Transaction } from 'web3-core';
import { EventData } from 'web3-eth-contract';
import Web3 from 'web3';
import { ETHBaseNetworkNotifier } from './eth.notifier';
import { processTransferEventsForSameTxAndRecipient } from '../../coin_gateway/coin_service/eth/eth.network.service';
import { ERC20_ABI } from '../../../../../contract/erc20.abi';
import { convertCoinAmountFromInt } from '../../../helpers/functions';
import { NetworkModel } from '../../../models/db/network.model';

export class ETHTokenNotifier {
  private ethNotifier: ETHBaseNetworkNotifier;

  constructor(ethNotifier: ETHBaseNetworkNotifier) {
    this.ethNotifier = ethNotifier;
  }

  async getMatchedToken(
    tx: Transaction,
    tokenAddressesData: string[],
  ): Promise<string> {
    for (let i = 0; i < tokenAddressesData.length; i++) {
      const tokenAddress = tokenAddressesData[i].split(':')[1];
      if (tx.to.toLowerCase() === tokenAddress.toLowerCase()) {
        return tokenAddressesData[i];
      }
    }
    return '';
  }

  async processBlockForTokens(
    network: NetworkModel,
    matchedTokensData: string[],
    userAddresses: string[],
    blockNumber: number,
    client: Web3,
  ) {
    for (let i = 0; i < matchedTokensData.length; i++) {
      const tokenAddress = matchedTokensData[i].split(':')[1];
      const contract = new client.eth.Contract(
        JSON.parse(ERC20_ABI),
        tokenAddress,
      );
      const transfers = await contract.getPastEvents('Transfer', {
        fromBlock: blockNumber,
        toBlock: blockNumber,
      });

      const transfersForDeposit =
        processTransferEventsForSameTxAndRecipient(transfers);

      for (let j = 0; j < transfers?.length; j++) {
        if (transfers[j]['removed']) continue;

        await this.processDeposit(
          matchedTokensData[i],
          userAddresses,
          network,
          transfersForDeposit[j],
          blockNumber,
        );
        await this.processWithdrawal(
          matchedTokensData[i],
          network,
          transfers[j],
          blockNumber,
        );
      }
    }
  }

  async processDeposit(
    tokenData: string,
    userAddresses: string[],
    network: NetworkModel,
    transferEvent: EventData,
    blockNumber: number,
  ): Promise<boolean> {
    //for user
    for (let k = 0; k < userAddresses.length; k++) {
      const depositFound = await this.processForDepositFind(
        tokenData,
        network,
        userAddresses[k],
        transferEvent,
        blockNumber,
      );
      if (depositFound) return true;
    }
  }

  async processForDepositFind(
    tokenData: string,
    network: NetworkModel,
    address: string,
    transferEvent: EventData,
    blockNumber: number | string,
  ): Promise<boolean> {
    const splitedTokenData = tokenData.split(':');
    const cryptoCode = splitedTokenData[0];
    const cryptoDecimal = Number(splitedTokenData[2]);

    const txid = transferEvent.transactionHash;
    const toAddress = transferEvent.returnValues['1'];
    const tokenAmount = transferEvent.returnValues['2'];

    if (
      toAddress &&
      toAddress.toLowerCase() == address.toLowerCase() &&
      Number(tokenAmount) > 0
    ) {
      const amount = convertCoinAmountFromInt(tokenAmount, cryptoDecimal);
      const depositArgsData = {
        txid: txid,
        crypto_code: cryptoCode,
        amount: amount,
        address: address,
        block_number: blockNumber,
        network: network,
      };

      console.log(depositArgsData);

      // await this.ethNotifier.finishDepositProcess(
      //   depositArgsData,
      //   blockNumber,
      //   forAdmin,
      //   this.logger,
      // );
      return true;
    }
    return false;
  }

  async processWithdrawal(
    tokenData: string,
    network: NetworkModel,
    transfer: EventData,
    blockNumber: number | string,
  ) {
    //for user
    // await processForWithdrawalFind(network, tx, vin, block.height, false);
    //for admin
    // await processForWithdrawalFind(network, tx, vin, block.height, false);
  }

  async processForWithdrawalFind(
    tokenData: string,
    network: NetworkModel,
    transfer: EventData,
    blockNumber: string | number,
    forAdmin: boolean,
  ) {
    return false;
  }
}
