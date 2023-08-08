import { Decimal } from '@prisma/client/runtime';
import { BaseModelHiddenBigInt } from '../../../libs/model/base.model';
import { CryptoCurrencyModel } from './crypto_currency.model';
import { User } from './user.model';

export class WalletModel extends BaseModelHiddenBigInt {
  balance: Decimal;
  status: number;
  crypto?: CryptoCurrencyModel;
  user?: User;
}
