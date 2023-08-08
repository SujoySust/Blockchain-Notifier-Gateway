import { ResponseModel } from '../../../models/custom/common.response.model';

export class WalletResponse extends ResponseModel {
  data: {
    private_key: string;
    public_key: string;
  };
}
