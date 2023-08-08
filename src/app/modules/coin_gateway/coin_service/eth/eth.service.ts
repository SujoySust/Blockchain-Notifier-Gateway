import { ResponseModel } from 'src/app/models/custom/common.response.model';
import { CoinModel } from 'src/app/models/db/coin.model';
import { NetworkModel } from 'src/app/models/db/network.model';
import {
  CoinServiceInterface,
  CoinSendParam,
  CoinTxObj,
  FeeEstimationParam,
  NodeWallet,
  TransactionConfig,
} from '../coin_gateway.interface';
import Web3, { Transaction, TransactionInfo, TransactionReceipt } from 'web3';
import {
  __,
  addNumbers,
  clearTrailingSlash,
  convertCoinAmountFromInt,
  convertCoinAmountToInt,
  errorResponse,
  minusNumbers,
  multiplyNumbers,
  sleep,
  successResponse,
} from '../../../../helpers/functions';
import { REGEX, SYSTEM_MESSAGES } from '../../../../helpers/coreconstant';
import { NETWORK_TRANSACTION_FEE_LIMIT } from '../../../../helpers/network_&_coin_constants';
import { TxNonceService } from '../tx_nonce.service';

export class ETHCoinService implements CoinServiceInterface {
  private network: NetworkModel;
  private web3: Web3;
  private coin: CoinModel;

  async init(network: NetworkModel, coin: CoinModel): Promise<void> {
    if (!network || !coin || !coin.currency) {
      throw new Error("Network, Coin, Coin Currency can't be empty");
    }
    this.network = network;
    this.coin = coin;
    this.web3 = new Web3(`${clearTrailingSlash(this.network.rpc_url)}`);
    this.web3.eth.transactionPollingTimeout = 3;
  }

  createWallet(): NodeWallet {
    const wallet = this.web3.eth.accounts.create();
    return {
      pvkey: wallet.privateKey,
      address: wallet.address,
    };
  }

  validateAddress(address: string): boolean {
    return new RegExp(REGEX.ETH_ADDRESS).test(address);
  }

  validateTxHash(txHash: string): boolean {
    return new RegExp(REGEX.ETH_TXHASH).test(txHash);
  }

  async getBalance(address: string): Promise<number> {
    const balance = await this.web3.eth.getBalance(address);
    return Number(convertCoinAmountFromInt(balance, this.coin.decimal));
  }

  async getTransaction(txHash: string): Promise<Transaction> {
    try {
      const txObj = await this.web3.eth.getTransaction(txHash);
      return txObj;
    } catch (e) {
      return null;
    }
  }

  async sendCoin(data: CoinSendParam): Promise<CoinTxObj> {
    const gasLimit = Number(NETWORK_TRANSACTION_FEE_LIMIT[this.network.slug]);
    const gasPrice = await this.web3.eth.getGasPrice();
    // const gasPrice = ETH_GAS_PRICE[this.network.slug];
    const fromAddress = this.web3.utils.toChecksumAddress(data.from);
    const tx: TransactionConfig = {
      from: fromAddress,
      to: this.web3.utils.toChecksumAddress(data.to),
      value: convertCoinAmountToInt(data.amount, this.coin.decimal),
      gasPrice: gasPrice.toString(),
      gas: gasLimit.toString(),
      nonce: 0,
    };

    const response = await this.estimateFee(data);
    if (!response.success) throw new Error(response.message);

    const txCount = await this.web3.eth.getTransactionCount(
      fromAddress,
      'latest',
    );
    tx.nonce = txCount;

    const txObj = await executeETHTransaction(
      tx,
      this.web3,
      data.pvkey,
      this.network,
    );
    return { txHash: txObj.transactionHash.toString() };
  }

  async estimateFee(data: FeeEstimationParam): Promise<ResponseModel> {
    const coinDecimal = this.coin.decimal;
    const gasLimit = Number(NETWORK_TRANSACTION_FEE_LIMIT[this.network.slug]);
    const cryptoCode = this.coin.currency.code;
    const gasPrice = await this.web3.eth.getGasPrice();
    // const gasPrice = ETH_GAS_PRICE[this.network.slug];
    let message = '';

    const tx = {
      from: this.web3.utils.toChecksumAddress(data.from),
      to: this.web3.utils.toChecksumAddress(data.to),
      value: convertCoinAmountToInt(data.amount, this.coin.decimal),
      gasPrice: gasPrice.toString(),
      gas: gasLimit.toString(),
    };

    // console.log(`\ngas limit: ${gasLimit}`);

    // console.log(`gas price (gwei): ${convertCoinAmountFromInt(Number(gasPrice), 9)}`);
    // console.log(`gas price (wei): ${gasPrice}`);

    const maxFee = Number(
      convertCoinAmountFromInt(
        multiplyNumbers(gasLimit, Number(gasPrice)),
        coinDecimal,
      ),
    );
    // console.log(`max fee: ${maxFee.toFixed(10)} ${cryptoCode}`);

    const amount = data.amount;
    // console.log(`amount to send: ${amount} ${cryptoCode}`);

    const balanceRequired = addNumbers(Number(maxFee), amount);
    // console.log(`balance required: ${balanceRequired.toFixed(10)} ${cryptoCode}`);

    const balance = await this.getBalance(data.from);
    // console.log(`balance exists: ${balance} ${cryptoCode}`);

    if (Number(balanceRequired) > Number(balance)) {
      const balanceShortage = minusNumbers(
        Number(balanceRequired),
        Number(balance),
      );
      message = `${__('Insufficient')} ${cryptoCode} ${__(
        'balance including fee',
      )}!!\n
       ${__('balance required')}: ${balanceRequired.toFixed(
        10,
      )} ${cryptoCode},\n
       ${__('balance exists')}: ${balance.toFixed(10)} ${cryptoCode},\n
       ${__('balance shortage')}: ${balanceShortage.toFixed(
        12,
      )} ${cryptoCode}.\n
       ${__('Try less amount. Or, ')}\n
       ${__(SYSTEM_MESSAGES.SYNC_MISSING_BALANCE)}`;
      // console.log(message);
      // console.log('\n');
      return errorResponse(message);
    }

    const gas = await this.web3.eth.estimateGas(tx);
    // console.log(`estimated gas: ${gas}`);

    if (gas > gasLimit) {
      message = `Network is too busy now, Fee is too high. ${__(
        'Sending',
      )} ${cryptoCode} ${__('coin in')} ${this.network.slug} 
      ${__('will ran out of gas. gas needed')}=${gas}, ${__(
        'gas limit we are sending',
      )}=${gasLimit}`;
      // console.log(message);
      // console.log('\n');
      return errorResponse(message);
    }

    const estimatedFee = Number(
      convertCoinAmountFromInt(
        multiplyNumbers(Number(gas), Number(gasPrice)),
        coinDecimal,
      ),
    );
    // console.log(`final estimated fee: ${estimatedFee.toFixed(10)} ${cryptoCode}\n`);

    return successResponse('', {
      fee: estimatedFee,
      fee_coin_id: this.coin.id,
      fee_crypto_id: this.coin.crypto_id,
    });
  }
  async getMaxFee(): Promise<number> {
    const gasPrice = await this.web3.eth.getGasPrice();
    // const gasPrice = ETH_GAS_PRICE[this.network.slug];
    const gasLimit = NETWORK_TRANSACTION_FEE_LIMIT[this.network.slug];
    const maxFee = Number(
      convertCoinAmountFromInt(
        multiplyNumbers(gasLimit, Number(gasPrice)),
        this.coin.decimal,
      ),
    );
    return maxFee;
  }
}

export async function executeETHTransaction(
  tx: TransactionConfig,
  web3: Web3,
  pvKey: string,
  network: NetworkModel,
  blockConfirmation = 0,
  waitForConfirm = false,
): Promise<TransactionReceipt> {
  const signedTx = await web3.eth.accounts.signTransaction(tx, pvKey);
  let txObj: TransactionReceipt = {
    status: 0,
    transactionHash: '',
    transactionIndex: 0,
    blockHash: '',
    blockNumber: 0,
    from: '',
    to: '',
    cumulativeGasUsed: 0,
    gasUsed: 0,
    logs: [],
    logsBloom: '',
    root: '',
  };
  try {
    txObj = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  } catch (e) {
    if (!e.message.includes('Transaction was not mined within')) {
      await new TxNonceService().updateTxNonce(
        network.id,
        String(tx.from),
        Number(tx.nonce) - 1,
      );
      console.error(
        `coin send error on network: ${network.slug}, tx hash: ${signedTx.transactionHash}`,
      );
      console.error(e.stack);
      throw e;
    } else {
      return txObj;
    }
  }
  if (waitForConfirm) {
    await waitForTxConfirmed(txObj, web3, blockConfirmation);
  }
  return txObj;
}

export async function waitForTxConfirmed(
  txObj: TransactionReceipt,
  web3: Web3,
  blockConfirmation: number,
) {
  try {
    let confirmations = 0;
    while (confirmations < blockConfirmation) {
      await sleep(15000); // sleep 15 sec

      const currentBlock = await web3.eth.getBlockNumber();
      confirmations = minusNumbers(
        Number(currentBlock),
        Number(txObj.blockNumber),
      );
    }
    const tx = await web3.eth.getTransaction(txObj.transactionHash);
    if (!tx) throw new Error(`Transaction Failed: ${txObj.transactionHash}`);
    return;
  } catch (e) {
    console.error(e.stack);
  }
}
