import { BaseModelHiddenId } from '../../../libs/model/base.model';
import { CryptoCurrencyModel } from './crypto_currency.model';
import { NetworkModel } from './network.model';

export class CoinModel extends BaseModelHiddenId {
  id: number;
  uid: string;
  network_id: number;
  crypto_id: number;
  decimal: number;
  type: number;
  contract_address?: string;
  status: number;
  currency?: CryptoCurrencyModel;
  network?: NetworkModel;
}
