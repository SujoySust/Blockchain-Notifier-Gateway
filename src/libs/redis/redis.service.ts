/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Global,
  INestApplication,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import RedisClient from '@redis/client/dist/lib/client';
import { RedisClientType } from '@redis/client/dist/lib/client';

@Injectable()
export class RedisService
  extends RedisClient<any, any, any>
  implements OnModuleInit
{
  private client: RedisClientType;
  constructor() {
    super({
      url: `redis://${process.env.REDIS_HOST || 'localhost'}:${
        Number(process.env.REDIS_PORT) || 6379
      }`,
      username: process.env.REDIS_USERNAME || undefined,
      password: process.env.REDIS_PASSWORD || undefined,
      database: Number(process.env.REDIS_DATABASE) || 0,
    });
  }
  async onModuleInit() {
    this.client = RedisService.create();
    await this.client.connect();
    this.client.on('error', (err) =>
      console.error(`Redis Client Error: ', ${err.stack}`),
    );
  }

  async get(key: string) {
    return await this.client.get(key);
  }

  async set(key: string, value: string | number) {
    return await this.client.set(key, value);
  }

  /* async enableShutdownHooks(app: INestApplication) {
    this.client.on('beforeExit', async () => {
      await app.close();
    });
  } */
}
