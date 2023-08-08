import { Decimal } from '@prisma/client/runtime';
import { BaseModelHiddenId } from '../../../libs/model/base.model';

export class CryptoCurrencyModel extends BaseModelHiddenId {
  id: number;
  name: string;
  code: string;
  symbol?: string;
  decimal: number;
  usd_rate: Decimal;
  status: number;
}
