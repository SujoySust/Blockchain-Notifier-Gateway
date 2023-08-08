import { NestFactory } from '@nestjs/core';
import { initCoreServices, setApp } from './app/helpers/functions';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import {
  APP_ENV,
  DEAFAULT_MAX_DATA_SIZE_IN_BYTE,
} from './app/helpers/coreconstant';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import * as passport from 'passport';
import { ConfigService } from '@nestjs/config';
import { CorsConfig } from './configs/config.interface';
import { PrismaService } from './libs/prisma/prisma.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import { MainModule } from './main.module';
import fileStore = require('session-file-store');
import * as session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(MainModule);
  setApp(app);
  initCoreServices();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((error) =>
          Object.values(error.constraints || {}),
        );
        return new BadRequestException(messages.flat());
      },
    }),
  );

  app.use(cookieParser());
  app.use(bodyParser.json({ limit: DEAFAULT_MAX_DATA_SIZE_IN_BYTE }));
  app.use(
    bodyParser.urlencoded({
      limit: DEAFAULT_MAX_DATA_SIZE_IN_BYTE,
      extended: true,
    }),
  );
  app.useGlobalPipes(new ValidationPipe());

  const FileStore = fileStore(session);

  app.use(
    session({
      store: new FileStore({ path: './storage/sessions' }),
      secret: 'my-secret',
      resave: false,
      saveUninitialized: false,
      //cookie: { secure: true },
      cookie: {
        maxAge: 60 * 60 * 24 * 1000, //1 day
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  const prismaService: PrismaService = app.get(PrismaService);
  prismaService.enableShutdownHooks(app);

  const configService = app.get(ConfigService);
  const corsConfig = configService.get<CorsConfig>('cors');

  // Cors
  if (corsConfig.enabled) {
    let origins: any = '*';
    if (
      process.env.APP_ENV == APP_ENV.PRODUCTION &&
      process.env.ALLOWED_ORIGINS != ''
    )
      origins = process.env.ALLOWED_ORIGINS.split(',');
    app.enableCors({
      origin: origins,
    });
  }

  const port = process.env.APP_PORT || 3000;
  app.listen(port);
  console.log(`Server started at http://localhost:${port}`);
}
bootstrap();
