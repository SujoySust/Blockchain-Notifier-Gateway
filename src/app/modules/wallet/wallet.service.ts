import { BadRequestException, Injectable } from '@nestjs/common';
import { WalletResponse } from './dto/response.dto';
import {
  __,
  decrypt,
  encrypt,
  errorResponse,
  prisma_client,
  successResponse,
} from '../../helpers/functions';
import { WalletCreateInput } from './dto/input.dto';
import { User } from '../../models/db/user.model';
import { throwNewError } from '../../exception/exception_filter';
import { CoinGatewayService } from '../coin_gateway/coin_service/coin_gateway.service';
import { CryptoCurrencyModel } from '../../models/db/crypto_currency.model';
import { NetworkModel } from '../../models/db/network.model';
import { CoinModel } from '../../models/db/coin.model';
import { NodeWallet } from '../coin_gateway/coin_service/coin_gateway.interface';

@Injectable()
export class WalletService {
  async createWallet(
    payload: WalletCreateInput,
    user: User,
  ): Promise<WalletResponse> {
    const { crypto_code, network_slug } = payload;

    const { crypto, network } = await this.findCryptoAndNetwork(
      crypto_code,
      network_slug,
    );
    const coin = await this.findCoin(crypto.id, network.id);

    const coinGatewayService = new CoinGatewayService();
    await coinGatewayService.init(network, coin);
    const keyPair = coinGatewayService.createWallet();
    await this.createNewWalletKey(keyPair, user.id, network.id);

    return {
      ...successResponse(),
      data: {
        private_key: keyPair.pvkey,
        public_key: keyPair.address,
      },
    };
  }

  async findCryptoAndNetwork(
    crypto_code: string,
    network_slug: string,
  ): Promise<{
    crypto: CryptoCurrencyModel;
    network: NetworkModel;
  }> {
    const [crypto, network] = await Promise.all([
      prisma_client.cryptoCurrency.findFirst({
        where: {
          code: crypto_code,
        },
      }),
      prisma_client.network.findFirst({
        where: {
          slug: network_slug,
        },
      }),
    ]);

    if (!crypto) throwNewError('Invalid crypto code');
    if (!network) throwNewError('Invalid network slug');
    return { crypto, network };
  }

  async findCoin(crypto_id: number, network_id: number): Promise<CoinModel> {
    const coin = await prisma_client.coin.findFirst({
      where: {
        crypto_id: crypto_id,
        network_id: network_id,
      },
      include: {
        currency: true,
      },
    });

    if (!coin) throwNewError('Invalid coin');
    return coin;
  }

  async createNewWalletKey(
    keyPair: NodeWallet,
    user_id: bigint,
    network_id: number,
  ): Promise<void> {
    const pvKeyEnc = this.encPv(
      keyPair.pvkey,
      `${keyPair.address}${network_id}${user_id}`,
    );
    await prisma_client.walletKey.create({
      data: {
        user_id: user_id,
        network_id: network_id,
        address: keyPair.address,
        pv: pvKeyEnc,
      },
    });
  }

  encPv(pv: string, sec: string): string {
    return encrypt(pv, Buffer.from(sec).toString('base64'));
  }

  decPv(encPv: string, sec: string): string {
    return decrypt(encPv, Buffer.from(sec).toString('base64'));
  }
}
