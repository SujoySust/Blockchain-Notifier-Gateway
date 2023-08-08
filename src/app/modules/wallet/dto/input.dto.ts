import { IsNotEmpty } from 'class-validator';
import { __ } from '../../../helpers/functions';

export class WalletCreateInput {
  @IsNotEmpty({
    message: () => __('Crypto is required'),
  })
  crypto_code: string;

  @IsNotEmpty({
    message: () => __('Network is required'),
  })
  network_slug: string;
}
