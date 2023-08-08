import { NetworkModel } from '../../models/db/network.model';
import { NotifierHelperService } from './notifier_helper.service';

export interface NotifierServiceInterface {
  network: NetworkModel;
  notifierHelper: NotifierHelperService;
  init(network: NetworkModel): Promise<void>;
  startNotifier(): Promise<void>;
  fetchBlockAndProcess(
    network: NetworkModel,
    blockNumber: number | string,
    client: any,
  ): Promise<void>;
  processBlock(network: NetworkModel, block: any, client?: any): Promise<void>;
  processDeposit(
    userAddresses: string[],
    network: NetworkModel,
    tx: any,
    blockNumber: string | number,
  ): Promise<any>;
  processForDepositFind(
    network: NetworkModel,
    address: string,
    tx: any,
    blockNumber: number | string,
    ...optionalParams: any[]
  ): Promise<boolean>;
  //   finishDepositProcess(
  //     depositArgsData: DepositBalanceArgs,
  //     blockNumber: string | number,
  //     forAdmin: boolean,
  //     ...optionalParams: any[]
  //   ): Promise<ResponseModel>;
  processWithdrawal(
    withdrawalTxIds: string[],
    network: NetworkModel,
    tx: any,
    blockNumber: number | string,
  ): Promise<any>;
  processForWithdrawalFind(
    withdrawalTxId: string,
    network: NetworkModel,
    tx: any,
    blockNumber: number | string,
    ...optionalParams: any[]
  ): Promise<any>;
}
