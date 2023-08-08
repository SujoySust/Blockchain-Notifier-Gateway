import { Exclude, Expose } from 'class-transformer';

export abstract class BaseModelBigInt {
  @Expose()
  id: bigint;
  @Expose()
  created_at?: Date;
  @Expose()
  updated_at?: Date;
}
export abstract class BaseModelHiddenBigInt {
  @Exclude()
  id: bigint;
  @Expose()
  created_at?: Date;
  @Expose()
  updated_at?: Date;
}

export abstract class BaseModel {
  @Expose()
  id: number;
  @Expose()
  created_at?: Date;
  @Expose()
  updated_at?: Date;
}
export abstract class BaseModelHiddenId {
  @Exclude()
  id: number;
  @Expose()
  created_at?: Date;
  @Expose()
  updated_at?: Date;
}
