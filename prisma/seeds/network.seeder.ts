import { PrismaClient } from '@prisma/client';
import {
  NETWORK_SLUG,
  ETH_CHAIN_ID,
  NETWORK_BASE_TYPE,
  NATIVE_CURRENCY,
} from '../../src/app/helpers/network_&_coin_constants';
import { STATUS_ACTIVE } from '../../src/app/helpers/coreconstant';

export async function seedNetwork(prisma?: PrismaClient) {
  const prismaFromExternal = prisma;
  prisma = prisma ?? new PrismaClient();

  await prisma.network.createMany({
    data: [
      {
        name: 'Bitcoin Testnet',
        slug: NETWORK_SLUG.BTC_TESTNET,
        native_currency: NATIVE_CURRENCY.BTC,
        base_type: NETWORK_BASE_TYPE.BTC,
        rpc_url:
          'https://btc.getblock.io/0d438d8c-a6a3-4477-9da2-3824b55de02f/testnet/',
        explorer_url: 'https://blockstream.info/testnet',
        chain_id: null,
        wss_url: null,
        logo: 'images/tokens/btc.png',
        description: 'This is Bitcoin testnet',
        status: STATUS_ACTIVE,
      },
      {
        name: 'Goerli',
        slug: NETWORK_SLUG.ETH_GOERLI,
        native_currency: NATIVE_CURRENCY.ETH,
        base_type: NETWORK_BASE_TYPE.ETH,
        rpc_url:
          'https://eth.getblock.io/0d438d8c-a6a3-4477-9da2-3824b55de02f/goerli/',
        explorer_url: 'https://goerli.etherscan.io',
        chain_id: ETH_CHAIN_ID.GOERLI,
        wss_url:
          'wss://eth.getblock.io/0d438d8c-a6a3-4477-9da2-3824b55de02f/goerli/',
        logo: 'images/tokens/eth.svg',
        description: 'Goerli is a Ethereum testnet',
        status: STATUS_ACTIVE,
      },
      {
        name: 'Mumbai',
        slug: NETWORK_SLUG.POLYGON_MUMBAI,
        native_currency: NATIVE_CURRENCY.MATIC,
        base_type: NETWORK_BASE_TYPE.ETH,
        rpc_url:
          'https://matic.getblock.io/0d438d8c-a6a3-4477-9da2-3824b55de02f/testnet/',
        explorer_url: 'https://mumbai.polygonscan.com',
        chain_id: ETH_CHAIN_ID.MUMBAI,
        wss_url:
          'wss://matic.getblock.io/0d438d8c-a6a3-4477-9da2-3824b55de02f/testnet/',
        logo: 'images/tokens/polygon.png',
        description: 'Mumbai is a Polygon testnet',
        status: STATUS_ACTIVE,
      },
    ],
    skipDuplicates: true,
  });

  if (!prismaFromExternal) await prisma.$disconnect();
}
