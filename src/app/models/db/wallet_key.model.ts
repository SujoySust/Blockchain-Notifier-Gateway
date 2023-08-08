import { BaseModelHiddenBigInt } from '../../../libs/model/base.model';

export class WalletKeyModel extends BaseModelHiddenBigInt {
  address: string;
  pvkey: string;
}
