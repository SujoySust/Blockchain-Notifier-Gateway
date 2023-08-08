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
import Web3, { Transaction } from 'web3';
import {
  __,
  clearTrailingSlash,
  convertCoinAmountFromInt,
  convertCoinAmountToInt,
  errorResponse,
  minusNumbers,
  multiplyNumbers,
  prisma_client,
  successResponse,
} from '../../../../helpers/functions';
import { REGEX, SYSTEM_MESSAGES } from '../../../../helpers/coreconstant';
import { CoinGatewayService } from '../coin_gateway.service';
import { NETWORK_TRANSACTION_FEE_LIMIT } from '../../../../helpers/network_&_coin_constants';
import { executeETHTransaction } from './eth.service';
import { TxNonceService } from '../tx_nonce.service';
import { ETHNetworkService } from './eth.network.service';
import { ERC20_ABI } from '../../../../../../contract/erc20.abi';

export class ERC20TokenService implements CoinServiceInterface {
  private network: NetworkModel;
  private coin: CoinModel;
  private web3: Web3;
  private tokenContract: any;
  private ethService: ETHNetworkService;

  async init(network: NetworkModel, coin: CoinModel) {
    if (!network || !coin || !coin.currency) {
      throw new Error("Netwrok, Coin, Coin Currency can't be empty");
    }
    this.network = network;
    this.coin = coin;
    this.web3 = new Web3(`${clearTrailingSlash(this.network.rpc_url)}`);
    this.web3.eth.transactionPollingTimeout = 3;
    this.tokenContract = new this.web3.eth.Contract(
      JSON.parse(ERC20_ABI),
      this.coin.contract_address,
    );
    this.ethService = new ETHNetworkService();
    this.ethService.init(network);
  }

  createWallet(): NodeWallet {
    return this.ethService.createWallet();
  }

  validateAddress(address: string): boolean {
    return this.ethService.validateAddress(address);
  }

  validateTxHash(txHash: string): boolean {
    return this.ethService.validateTxHash(txHash);
  }

  async getBalance(address: string): Promise<number> {
    const balance = await this.tokenContract.methods.balanceOf(address).call();
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
    const amount = convertCoinAmountToInt(data.amount, this.coin.decimal);
    const toAddress = this.web3.utils.toChecksumAddress(data.to);
    const fromAddress = this.web3.utils.toChecksumAddress(data.from);
    const call = await this.tokenContract.methods.transfer(toAddress, amount);

    const response = await this.estimateFee(data);
    if (!response.success) throw new Error(response.message);

    const txCount = await this.web3.eth.getTransactionCount(
      fromAddress,
      'latest',
    );
    const nonce = await new TxNonceService().getLatestNonce(
      this.network.id,
      data.from,
      Number(txCount),
    );

    const tx: TransactionConfig = {
      from: fromAddress,
      nonce: nonce,
      to: this.web3.utils.toChecksumAddress(this.coin.contract_address),
      data: call.encodeABI(),
      gasPrice: gasPrice.toString(),
      gas: gasLimit.toString(),
    };
    const txObj = await executeETHTransaction(
      tx,
      this.web3,
      data.pvkey,
      this.network,
    );
    return { txHash: txObj.transactionHash.toString() };
  }

  async estimateFee(data: FeeEstimationParam): Promise<ResponseModel> {
    let message = '';
    const cryptoCode = this.coin.currency.code;
    const nativeCode = this.network.native_currency;
    const nativeCoin = await prisma_client.coin.findFirst({
      where: {
        network_id: this.network.id,
        currency: {
          code: {
            equals: nativeCode,
            mode: 'insensitive',
          },
        },
      },
      include: {
        currency: true,
      },
    });
    if (!nativeCoin)
      throw new Error(`Native coin not found of network: ${this.network.slug}`);
    const nativeDecimal = nativeCoin.decimal;

    const gasLimit = Number(NETWORK_TRANSACTION_FEE_LIMIT[this.network.slug]);
    const gasPrice = await this.web3.eth.getGasPrice();
    // const gasPrice = Number(ETH_GAS_PRICE[this.network.slug]);

    // console.log('\n');
    // console.log(`gas limit: ${gasLimit}`);
    // console.log(`gas price (gwei): ${convertCoinAmountFromInt(Number(gasPrice), 9)}`);
    // console.log(`gas price (wei): ${gasPrice}`);

    const toAddress = this.web3.utils.toChecksumAddress(data.to);
    const fromAddress = this.web3.utils.toChecksumAddress(data.from);
    const tokenAmount = convertCoinAmountToInt(data.amount, this.coin.decimal);

    //token balance checking
    const balanceRequired = data.amount;
    // console.log(`balance required: ${balanceRequired.toFixed(10)} ${cryptoCode}`);

    const balance = await this.getBalance(data.from);
    // console.log(`balance exists: ${balance} ${cryptoCode}`);

    if (Number(balanceRequired) > Number(balance)) {
      const balanceShortage = minusNumbers(
        Number(balanceRequired),
        Number(balance),
      );
      message = `${__('Insufficient')} ${cryptoCode} ${__('balance')}!!\n
      ${__('balance required')}: ${balanceRequired.toFixed(10)} ${cryptoCode},\n
      ${__('balance exists')}: ${balance.toFixed(10)} ${cryptoCode},\n
      ${__('balance shortage')}: ${balanceShortage.toFixed(12)} ${cryptoCode}.\n
      ${__('Try less amount. Or, ')}\n
      ${__(SYSTEM_MESSAGES.SYNC_MISSING_BALANCE)}`;
      // console.log(message);
      // console.log('\n');
      return errorResponse(message);
    }
    //

    /** fee balance checking **/
    const maxFee = Number(
      convertCoinAmountFromInt(
        multiplyNumbers(gasLimit, Number(gasPrice)),
        nativeDecimal,
      ),
    );
    // console.log(`max fee: ${maxFee.toFixed(10)} ${nativeCode}`);

    const feeBalanceRequired = maxFee;
    // console.log(`fee balance required: ${feeBalanceRequired.toFixed(10)} ${nativeCode}`);

    const nativeCoinService = new CoinGatewayService();
    await nativeCoinService.init(this.network, nativeCoin);
    const feeBalance = await nativeCoinService.getBalance(fromAddress);
    // console.log(`fee balance exists: ${feeBalance} ${nativeCode}`);

    if (Number(feeBalanceRequired) > Number(feeBalance)) {
      const feeBalanceShortage = minusNumbers(
        Number(feeBalanceRequired),
        Number(feeBalance),
      );
      message = `${__('Insufficient')} ${nativeCode} ${__('Fee balance')}!!\n
       ${__('Fee balance required')}: ${feeBalanceRequired.toFixed(
        10,
      )} ${nativeCode},\n
       ${__('Fee balance exists')}: ${feeBalance.toFixed(10)} ${nativeCode},\n
       ${__('Fee balance shortage')}: ${feeBalanceShortage.toFixed(
        12,
      )} ${nativeCode}.\n
       ${__(SYSTEM_MESSAGES.SYNC_MISSING_BALANCE)}`;
      // console.log(message);
      // console.log('\n');
      return errorResponse(message, { maxFee: maxFee });
    }
    /** **/

    const call = await this.tokenContract.methods.transfer(
      toAddress,
      tokenAmount,
    );
    const gas = await call.estimateGas({
      from: fromAddress,
    });
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
        multiplyNumbers(gas, Number(gasPrice)),
        nativeDecimal,
      ),
    );
    // console.log(`final estimated fee: ${estimatedFee.toFixed(10)} ${nativeCode}\n`);

    return successResponse('', {
      fee: estimatedFee,
      fee_coin_id: nativeCoin.id,
      fee_crypto_id: nativeCoin.crypto_id,
    });
  }

  async getMaxFee(): Promise<number> {
    return await this.ethService.getMaxFee();
  }

  async totalDecimal(): Promise<string> {
    return await this.tokenContract.methods.totalDecimal().call();
  }

  async allowance(owner: string, operator: string): Promise<string> {
    return await this.tokenContract.methods.allowance(owner, operator).call();
  }
}
