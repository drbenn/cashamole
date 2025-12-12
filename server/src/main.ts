import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  // do not need to determineEnvFile path as envFilePath is passed to ConfigModule.forRoot() in AppModule.
  const configService = app.get(ConfigService);

  // app.use(cookieParser());
    // We use require() here because it correctly resolves the middleware function 
  // from the CommonJS module, bypassing TypeScript module interop issues.
  app.use(cookieParser());
  const globalPrefix: string = configService.get<string>('URL_GLOBAL_PREFIX') ?? 'undefined-main-global-prefix';
  console.log('globalPrefix: ', globalPrefix);
  
  app.setGlobalPrefix(globalPrefix);
  // app.enableCors()
  // app.enableCors({
  //   origin: '*', // Allows any origin
  //   credentials: true,
  // });

  console.log('1: ', configService.get<string>('FRONTEND_URL'));
  console.log('2: ', process.env.FRONTEND_URL)
  
  
  // app.enableCors({
  //   origin: [configService.get<string>('FRONTEND_URL') || process.env.FRONTEND_URL],
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  //   credentials: true,
  //   allowedHeaders: ['Content-Type', 'Authorization'],
  // });
  app.enableCors({
    origin: [configService.get<string>('FRONTEND_URL') || process.env.FRONTEND_URL],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    // domain: 'localhost'
  });

  const port = configService.get<number>('APP_PORT') || 3080;
  await app.listen(port ?? 3000);
}
bootstrap();
