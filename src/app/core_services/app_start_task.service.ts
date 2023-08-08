import { prisma_client, redis_client } from '../helpers/functions';
import { CACHE_KEYS, COIN_TYPE } from '../helpers/network_&_coin_constants';
import { NetworkModel } from '../models/db/network.model';
import { notifiers } from '../modules/notifiers/notifiers';

export async function processStartingTasks() {
  try {
    const networks = await prisma_client.network.findMany({
      orderBy: [{ id: 'asc' }],
    });
    await cacheNetworkData(networks);
    notifiers(networks);
  } catch (e) {
    console.error(e.stack);
  }
}

export async function cacheNetworkData(networks: NetworkModel[]) {
  await cacheAddresses(networks);
}

export async function cacheAddresses(networks: NetworkModel[]) {
  networks.forEach(async (network) => {
    await cacheUserWalletAddresses(network);
    await cacheTokenContractAddresses(network);
  });
}

export async function cacheUserWalletAddresses(
  network: NetworkModel,
  fromDbMust = false,
): Promise<string[]> {
  let addresses: string[];
  let cacheData: string;
  if (!fromDbMust) {
    cacheData = await redis_client.get(
      `${network.slug}:${CACHE_KEYS.WALLET_ADDRESSES}`,
    );
  }
  if (!cacheData) {
    const walletKeys = await prisma_client.walletKey.findMany({
      where: { network_id: network.id },
      select: { address: true },
    });
    addresses = walletKeys.map((walletKey) => walletKey.address);
  } else {
    addresses = cacheData.split(',');
  }

  if (!cacheData) {
    addresses.length &&
      (await redis_client.set(
        `${network.slug}:${CACHE_KEYS.WALLET_ADDRESSES}`,
        addresses.toString(),
      ));
  }
  return addresses;
}

export async function cacheTokenContractAddresses(
  network: NetworkModel,
  fromDbMust = false,
): Promise<string[]> {
  let addresses: string[];
  let cacheData: string;
  if (!fromDbMust) {
    cacheData = await redis_client.get(
      `${network.slug}:${CACHE_KEYS.TOKEN_ADDRESSES}`,
    );
  }
  if (!cacheData) {
    const coins = await prisma_client.coin.findMany({
      where: { network_id: network.id, type: COIN_TYPE.TOKEN },
      select: {
        contract_address: true,
        decimal: true,
        currency: { select: { code: true } },
      },
    });
    addresses = coins.map(
      (coin) =>
        `${coin.currency.code}:${coin.contract_address}:${coin.decimal}`,
    );
  } else {
    addresses = cacheData.split(',');
  }

  if (!cacheData) {
    addresses.length &&
      (await redis_client.set(
        `${network.slug}:${CACHE_KEYS.TOKEN_ADDRESSES}`,
        addresses.toString(),
      ));
  }
  return addresses;
}
