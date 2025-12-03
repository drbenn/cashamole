import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // do not need to determineEnvFile path as envFilePath is passed to ConfigModule.forRoot() in AppModule.
  const configService = app.get(ConfigService);

  // const port = configService.get<number>('APP_PORT') || 3000;
  app.use(cookieParser());

  app.setGlobalPrefix(configService.get<string>('URL_GLOBAL_PREFIX'));
  // app.enableCors(),
  app.enableCors({
    origin: [process.env.FRONTEND_URL],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
