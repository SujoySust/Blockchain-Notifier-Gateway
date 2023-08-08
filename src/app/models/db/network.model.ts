import { BaseModelHiddenId } from '../../../libs/model/base.model';
import { CoinModel } from './coin.model';
import { CryptoCurrencyModel } from './crypto_currency.model';

export class NetworkModel extends BaseModelHiddenId {
  id: number;
  name: string;
  description?: string;
  slug: string;
  base_type: number;
  block_confirmation: number;
  native_currency: string;
  explorer_url?: string;
  chain_id?: string;
  rpc_url?: string;
  wss_url?: string;
  coins?: CoinModel[];
  native_crypto?: CryptoCurrencyModel;
}
