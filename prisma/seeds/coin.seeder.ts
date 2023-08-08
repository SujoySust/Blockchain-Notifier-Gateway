import { PrismaClient } from '@prisma/client';
import { COIN_TYPE } from '../../src/app/helpers/network_&_coin_constants';
import { STATUS_ACTIVE } from '../../src/app/helpers/coreconstant';

export async function seedCoin(prisma?: PrismaClient) {
  const prismaFromExternal = prisma;
  prisma = prisma ?? new PrismaClient();

  await prisma.coin.createMany({
    data: [
      {
        // btc -> bitcoin
        crypto_id: 1,
        network_id: 1,
        type: COIN_TYPE.NATIVE,
        decimal: 8,
        contract_address: null,
        status: STATUS_ACTIVE,
      },
      {
        // btc -> mumbai
        crypto_id: 1,
        network_id: 3,
        type: COIN_TYPE.TOKEN,
        contract_address: '0x1086919c68c599FbfF0452F484a5c1063cC736F6',
        decimal: 18,
        status: STATUS_ACTIVE,
      },
      {
        // eth -> goerli
        crypto_id: 2,
        network_id: 2,
        type: COIN_TYPE.NATIVE,
        contract_address: null,
        decimal: 18,
        status: STATUS_ACTIVE,
      },
      {
        // matic -> mumbai
        crypto_id: 3,
        network_id: 3,
        type: COIN_TYPE.NATIVE,
        contract_address: null,
        decimal: 18,
        status: STATUS_ACTIVE,
      },
    ],
    skipDuplicates: true,
  });

  if (!prismaFromExternal) await prisma.$disconnect();
}
