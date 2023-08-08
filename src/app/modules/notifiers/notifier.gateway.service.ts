import { NETWORK_BASE_TYPE } from '../../helpers/network_&_coin_constants';
import { NetworkModel } from '../../models/db/network.model';
import { BTCBaseNetworkNotifier } from './btc/btc.notifier';
import { ETHBaseNetworkNotifier } from './eth/eth.notifier';
import { NotifierServiceInterface } from './notifier.interface';
import { NotifierHelperService } from './notifier_helper.service';

export const NETWORK_BASE_TYPE_NOTIFIER_SERVICE = {
  [NETWORK_BASE_TYPE.BTC]: BTCBaseNetworkNotifier,
  [NETWORK_BASE_TYPE.ETH]: ETHBaseNetworkNotifier,
};

export class NotifierGatewayService implements NotifierServiceInterface {
  network: NetworkModel;
  private notifierService: NotifierServiceInterface;
  notifierHelper: NotifierHelperService;

  async init(network: NetworkModel) {
    if (!network) {
      throw new Error("Netwrok can't be empty");
    }
    const service = NETWORK_BASE_TYPE_NOTIFIER_SERVICE[network.base_type];
    if (!service)
      throw new Error(
        `No service found. Invalid network base_type: ${network.base_type}`,
      );
    this.notifierService = new service();
    await this.notifierService.init(network);
    this.network = this.notifierService.network;
    this.notifierHelper = this.notifierService.notifierHelper;
  }

  async startNotifier() {
    return this.notifierService.startNotifier();
  }

  async fetchBlockAndProcess(
    network: NetworkModel,
    blockNumber: number,
    client: any,
    // notifierHelper?: NotifierHelperService,
  ) {
    return await this.notifierService.fetchBlockAndProcess(
      network,
      blockNumber,
      client,
      // notifierHelper,
    );
  }

  async processBlock(
    network: NetworkModel,
    block: any,
    // notifierHelper?: NotifierHelperService,
  ) {
    return await this.notifierService.processBlock(
      network,
      block,
      // notifierHelper,
    );
  }

  async processDeposit(
    userAddresses: string[],
    adminAddresses: string[],
    network: NetworkModel,
    tx: any,
    blockNumber: string | number,
  ): Promise<void> {
    return await this.notifierService.processDeposit(
      userAddresses,
      adminAddresses,
      network,
      tx,
      blockNumber,
    );
  }

  async processForDepositFind(
    network: NetworkModel,
    address: string,
    tx: any,
    blockNumber: string | number,
    forAdmin: boolean,
    ...optionalParams: any[]
  ): Promise<boolean> {
    return await this.notifierService.processForDepositFind(
      network,
      address,
      tx,
      blockNumber,
      forAdmin,
      ...optionalParams,
    );
  }

  // async finishDepositProcess(
  //   depositArgsData: DepositBalanceArgs,
  //   blockNumber: string | number,
  //   forAdmin: boolean,
  //   ...optionalParams: any[]
  // ): Promise<ResponseModel> {
  //   return await this.notifierService.finishDepositProcess(
  //     depositArgsData,
  //     blockNumber,
  //     forAdmin,
  //     ...optionalParams,
  //   );
  // }

  async processWithdrawal(
    withdrawalTxIds: string[],
    network: NetworkModel,
    tx: any,
    blockNumber: string | number,
  ): Promise<void> {
    return await this.notifierService.processWithdrawal(
      withdrawalTxIds,
      network,
      tx,
      blockNumber,
    );
  }

  async processForWithdrawalFind(
    withdrawalTxId: string,
    network: NetworkModel,
    tx: any,
    blockNumber: string | number,
    ...optionalParams: any[]
  ): Promise<void> {
    return await this.notifierService.processForWithdrawalFind(
      withdrawalTxId,
      network,
      tx,
      blockNumber,
      ...optionalParams,
    );
  }
}
