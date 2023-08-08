import { PrismaClient } from '@prisma/client';
import { seedCoin } from './seeds/coin.seeder';
import { seedCryptoCurrency } from './seeds/crypto_currency.seeder';
import { seedNetwork } from './seeds/network.seeder';

const prisma = new PrismaClient({ log: ['query'] });
//pass prisma from here to log or empty

async function main() {
  await seedCryptoCurrency(prisma);
  await seedNetwork(prisma);
  await seedCoin(prisma);
  //
}

main()
  .catch((e) => {
    console.error(e.stack);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
