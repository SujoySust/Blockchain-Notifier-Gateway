import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'nestjs-prisma';
import { ServeStaticModule } from '@nestjs/serve-static';
import { resolve } from 'path';

import { CorsConfig } from './configs/cors.config';
import { AppConfig } from './configs/app.config';

import { Global, MiddlewareConsumer, Module } from '@nestjs/common';

import { AppModule } from './app/app.module';
import { HttpModule } from '@nestjs/axios';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { AuthConfig } from './configs/auth.config';
import { JWTConfig } from './configs/security.config';
import { PrismaService } from './libs/prisma/prisma.service';
import { CoinGatewayModule } from './app/modules/coin_gateway/coin_gateway.module';

@Global()
@Module({
  imports: [
    // Core Modules
    ConfigModule.forRoot({
      isGlobal: true,
      load: [CorsConfig, AppConfig, AuthConfig, JWTConfig],
    }),
    ServeStaticModule.forRoot({
      rootPath: resolve('public'),
      exclude: ['/graphql*'],
    }),
    PrismaModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: Number(process.env.REQUEST_LIMIT_PER_MINUTE || 0) || 60,
      storage: new ThrottlerStorageRedisService({
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        username: process.env.REDIS_USERNAME || undefined,
        password: process.env.REDIS_PASSWORD || undefined,
        db: Number(process.env.REDIS_DATABASE) || 0,
      }),
    }),
    HttpModule,
    // Application Modules
    AppModule,
    CoinGatewayModule,
  ],
  controllers: [],
  providers: [PrismaService],
  exports: [PrismaService, HttpModule],
})
export class MainModule {
  configure(consumer: MiddlewareConsumer) {
    //
  }
}
