import { redis_client, prisma_client, sleep } from '../../helpers/functions';
import { Prisma } from '@prisma/client';
import { NetworkModel } from '../../models/db/network.model';
import { NotifierServiceInterface } from './notifier.interface';
import {
  BLOCK_FETCH_INTERVAL_SEC,
  CACHE_KEYS,
} from '../../helpers/network_&_coin_constants';
import { STATUS_ACTIVE } from '../../helpers/coreconstant';
import { NetworkGatewayService } from '../../core_services/network_gateway.service';

export class NotifierHelperService {
  async fetchNetworkCacheData(
    network: NetworkModel,
    cacheKey: CACHE_KEYS,
    storeAndFetchDataToCache: (
      network: NetworkModel,
      fromDbMust: boolean,
    ) => Promise<string[]>,
  ): Promise<string[]> {
    let resData: string[];
    const cacheData = <string>(
      await redis_client.get(`${network.slug}:${cacheKey}`)
    );
    if (!cacheData) {
      resData = await storeAndFetchDataToCache(network, true);
    } else {
      resData = cacheData.split(',');
    }
    return resData;
  }

  async getInitBlockNumber(
    network: NetworkModel,
    currentBlock: number,
  ): Promise<{ blockNumber: number; currentBlock: number }> {
    let blockNumber: number;
    if (currentBlock == 0) {
      return { blockNumber: 0, currentBlock };
    }
    return { blockNumber, currentBlock };
  }

  async getNextBlockNumber(
    blockNumber: number,
    network: NetworkModel,
    currentBlock: number,
  ): Promise<{ blockNumber: number; currentBlock: number }> {
    if (currentBlock == 0) {
      return { blockNumber: 0, currentBlock };
    }
    if (blockNumber == 0) {
      blockNumber = currentBlock - network.block_confirmation;
      blockNumber = blockNumber < 0 ? 0 : blockNumber;
      return { blockNumber, currentBlock };
    }
    blockNumber += 1;
    const shouldCallBlock = currentBlock - network.block_confirmation;
    if (blockNumber > shouldCallBlock) {
      blockNumber = shouldCallBlock;
    }
    return { blockNumber, currentBlock };
  }

  async processIntervalTime(
    startTime: number,
    networkSlug?: string,
    blockNumber?: any,
  ) {
    const endTime = +new Date();
    // this.logger.write(`interval task end: ${new Date().toLocaleString()}`);

    const diffInSec = (endTime - startTime) / 1000;
    // this.logger.write(`interval time took: ${diffInSec} sec`);
    // this.logger.write(`interval setting: ${BLOCK_FETCH_INTERVAL_SEC} sec`);

    if (diffInSec < BLOCK_FETCH_INTERVAL_SEC) {
      const sleepTimeinSec = BLOCK_FETCH_INTERVAL_SEC - diffInSec;
      // this.logger.write(`interval sleep time needed: ${sleepTimeinSec} sec`);
      // this.logger.write(`interval sleep start: ${new Date().toLocaleString()}`);
      await sleep(sleepTimeinSec * 1000);
      // this.logger.write(`interval sleep end: ${new Date().toLocaleString()}`);
    }
  }

  async coreNotifierProcess(
    network: NetworkModel,
    notifierService: NotifierServiceInterface,
  ) {
    const networkSlug = network.slug;
    global.reset_block[networkSlug] = false;
    let blockNumber = 0;
    let currentBlock = 0;
    let prevBlock = 0;
    let isFirstCall = true;
    let networkService = new NetworkGatewayService();
    try {
      await networkService.init(network);
      currentBlock = Number(await networkService.getBlockNumber());
      const initBlockData = await this.getInitBlockNumber(
        network,
        currentBlock,
      );
      blockNumber = initBlockData.blockNumber;
      currentBlock = initBlockData.currentBlock;
      prevBlock = blockNumber - 1;
    } catch (e) {
      // blockNumber = network?.notified_block?.block_number
      //   ? Number(network?.notified_block?.block_number)
      //   : 0;
      if (blockNumber > 0) prevBlock = blockNumber - 1;
      // this.logger.write(e.stack, LOG_LEVEL_ERROR);
      // await this.upsertNotifiedBlock({
      //   network_id: network.id,
      //   // error: `${e.message}. Check more details in log "${this.logger.logFile}"`,
      // });
    }

    // let i = 0;

    // setInterval(async () => {
    while (true) {
      const startTime = +new Date();
      try {
        // this.logger.write(`interval start: ${new Date().toLocaleString()}`);

        // i += 1;
        if (!isFirstCall) {
          network = await prisma_client.network.findFirst({
            where: { slug: networkSlug, status: STATUS_ACTIVE },
          });
          if (!network) {
            await this.processIntervalTime(startTime, networkSlug, blockNumber);
            continue;
          }
          network.native_crypto = await prisma_client.cryptoCurrency.findUnique(
            {
              where: { code: network.native_currency },
            },
          );

          networkService = new NetworkGatewayService();
          await networkService.init(network);
          currentBlock = Number(await networkService.getBlockNumber());
          const nextBlockData = await this.getNextBlockNumber(
            blockNumber,
            network,
            currentBlock,
          );
          blockNumber = nextBlockData.blockNumber;
          currentBlock = nextBlockData.currentBlock;
        }
        // this.logger.write(`interval: ${i}`);
        // this.logger.write(`currentBlock: ${currentBlock}`);
        // this.logger.write(`blockNumber: ${blockNumber}`);
        // this.logger.write(`prevBlock: ${prevBlock}`);

        if (prevBlock == blockNumber) {
          if (isFirstCall) isFirstCall = false;
          // await this.upsertNotifiedBlock({
          //   network_id: network.id,
          //   block_number: String(blockNumber),
          //   node_block: String(currentBlock),
          // });
          await this.processIntervalTime(startTime, networkSlug, blockNumber);
          continue;
        }

        if (isFirstCall) isFirstCall = false;
        // await this.upsertNotifiedBlock({
        //   network_id: network.id,
        //   block_number: String(blockNumber),
        //   node_block: String(currentBlock),
        // });

        // this.logger.write(`fetching_block: ${blockNumber}`);
        await notifierService.fetchBlockAndProcess(
          network,
          blockNumber,
          networkService.client,
        );
        // this.logger.write(`finished_block: ${blockNumber}`);

        prevBlock = blockNumber;

        await this.processIntervalTime(startTime, networkSlug, blockNumber);

        //reset block number
        if (global.reset_block[networkSlug]) {
          blockNumber = 0;
          global.reset_block[networkSlug] = false;
        }

        // this.logger.write('\n');
      } catch (e) {
        blockNumber = prevBlock;
        if (e.message !== 'skip') {
          // this.logger.write(e.stack, LOG_LEVEL_ERROR);
          // await this.upsertNotifiedBlock({
          //   network_id: network.id,
          //   error: `${e.message}. Check more details in log '${this.logger.logFile}'`,
          // });
        }
        await this.processIntervalTime(startTime, networkSlug, blockNumber);
        // this.logger.write('\n');
      }
    }
  }

  // async upsertNotifiedBlock(
  //   data: Prisma.XOR<
  //     Prisma.NotifiedBlockUpdateInput,
  //     Prisma.NotifiedBlockUncheckedUpdateInput
  //   >,
  // ) {
  //   data.error = data.error ?? null;
  //   await prisma_client.notifiedBlock.upsert({
  //     where: { network_id: Number(data.network_id) },
  //     create: {
  //       network_id: Number(data.network_id),
  //       block_number: String(data.block_number),
  //       node_block: String(data.node_block),
  //     },
  //     update: data,
  //   });
  // }
}
