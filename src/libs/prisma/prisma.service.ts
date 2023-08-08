/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Global,
  INestApplication,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime';
import { isArray } from 'class-validator';
import { addNumbers } from '../../app/helpers/functions';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });
  }
  async onModuleInit() {
    await this.$connect();
    this.$on<any>('error', (e: any) => {
      console.log('Prisma-Error: ' + JSON.stringify(e), 'error');
    });
    this.$on<any>('warn', (e: any) => {
      console.log('Prisma-Warn: ' + e.message, 'warn');
    });
    if (process.env.QUERY_DEBUG === 'true') {
      this.$on<any>('query', (e: any) => {
        console.log('\nQuery: ' + e.query /* , 'debug', undefined, 'stdout' */);
        console.log('Params: ' + e.params /* , 'debug', undefined, 'stdout' */);
        console.log(
          'Duration: ' + e.duration + 'ms\n' /* ,
          'debug',
          undefined,
          'stdout', */,
        );
      });
    }

    // Decimal type value mutation while create or update middleware
    this.$use(mutateDecimalsMW);
    // this.$use(getDecimalsMW);

    //middlewares example
    /* this.$use(async (params, next) => {
      // Check incoming query type
      if (params.model === 'User') {
        console.log(JSON.stringify(params));
      }
      return next(params);
    }); */
    //
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}

async function mutateDecimalsMW(
  params: Prisma.MiddlewareParams,
  next: (params: Prisma.MiddlewareParams) => Promise<any>,
) {
  const validActions = [
    'create',
    'createMany',
    'update',
    'updateMany',
    'upsert',
  ];

  if (validActions.includes(params.action)) {
    const data = params.args.data;
    for (const key in data) {
      if (
        data[key] != null &&
        data[key] != undefined &&
        data[key] instanceof Decimal
      ) {
        params.args.data[key] = String(params.args.data[key]);
      }
    }
  }
  return next(params);
}

async function getDecimalsMW(
  params: Prisma.MiddlewareParams,
  next: (params: Prisma.MiddlewareParams) => Promise<any>,
) {
  const validActions = ['findUnique', 'findMany', 'findFirst', 'queryRaw'];
  let data = await next(params);

  if (validActions.includes(params.action)) {
    if (isArray(data)) {
      data.forEach((item: any) => {
        item = processDecimalDataGet(item);
      });
    } else {
      data = processDecimalDataGet(data);
    }
  }
  return data;
}

function processDecimalDataGet(item: any) {
  for (const key in item) {
    if (
      item[key] != null &&
      item[key] != undefined &&
      (item[key] instanceof Decimal || typeof item[key] == 'number')
    ) {
      item[key] = addNumbers(item[key], 0);
      item[key] = Number(item[key])['noExponents']();
    }
  }
  return item;
}
