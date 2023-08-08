/* eslint-disable prettier/prettier */
import { BaseModelHiddenBigInt } from '../../../libs/model/base.model';
import { Exclude, Expose } from 'class-transformer';
export class User
  extends BaseModelHiddenBigInt
{
  @Expose()
  usercode: string;
  @Expose()
  name?: string;
  @Expose()
  email?: string;
  @Exclude()
  password: string | null;
  @Expose()
  status: number;
}
