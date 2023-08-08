import { prisma_client } from '../../../helpers/functions';

/* eslint-disable @typescript-eslint/no-var-requires */
export class TxNonceService {
  async getLatestNonce(
    network_id: number,
    address: string,
    txCount: number,
  ): Promise<number> {
    // console.log(
    //   `network_id: ${network_id}, address: ${address}, txCount: ${txCount}`,
    // );
    return txCount;

    let txNonce = await prisma_client.txNonce.findFirst({
      where: {
        network_id: network_id,
        wallet_address: {
          equals: address,
          mode: 'insensitive',
        },
      },
    });
    if (!txNonce) {
      txNonce = await prisma_client.txNonce.create({
        data: {
          network_id: network_id,
          wallet_address: address,
        },
      });
    }
    let nonce = Number(txNonce.nonce);
    if (nonce == 0 || nonce < txCount) {
      nonce = txCount;
    } else {
      nonce += 1;
    }
    await prisma_client.txNonce.update({
      where: {
        id: txNonce.id,
      },
      data: {
        nonce: nonce.toString(),
      },
    });
    return nonce;
  }

  async updateTxNonce(
    network_id: number,
    address: string,
    nonce: number | string,
  ) {
    return null;

    await prisma_client.txNonce.updateMany({
      where: {
        network_id: network_id,
        wallet_address: {
          equals: address,
          mode: 'insensitive',
        },
      },
      data: {
        nonce: String(nonce),
      },
    });
  }
}
