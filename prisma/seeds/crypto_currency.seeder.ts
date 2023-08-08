import { PrismaClient } from '@prisma/client';
import { STATUS_ACTIVE } from '../../src/app/helpers/coreconstant';

export async function seedCryptoCurrency(prisma?: PrismaClient) {
  const prismaFromExternal = prisma;
  prisma = prisma ?? new PrismaClient();

  await prisma.cryptoCurrency.createMany({
    data: [
      {
        name: 'Bitcoin',
        code: 'BTC',
        status: STATUS_ACTIVE,
        decimal: 8,
        logo: 'images/tokens/btc.png',
      },
      {
        name: 'Tether USD',
        code: 'USDT',
        status: STATUS_ACTIVE,
        decimal: 6,
        logo: 'images/tokens/usdt.png',
      },
      {
        name: 'Ether',
        code: 'ETH',
        status: STATUS_ACTIVE,
        decimal: 18,
        logo: 'images/tokens/eth.svg',
      },
      {
        name: 'Matic',
        code: 'MATIC',
        status: STATUS_ACTIVE,
        decimal: 18,
        logo: 'images/tokens/matic.png',
      },
    ],
    skipDuplicates: true,
  });

  if (!prismaFromExternal) await prisma.$disconnect();
}
