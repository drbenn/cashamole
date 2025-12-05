import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as winston from 'winston';
import { ThrottlerModule } from '@nestjs/throttler';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailModule } from './email/email.module';
import { DatabaseModule } from './database/database.module';
import { TransactionModule } from './transaction/transaction.module';
import { SnapshotModule } from './snapshot/snapshot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: determineEnvFilePath(),
    }),
    ThrottlerModule.forRootAsync({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TIME_TO_LIVE') ?? 60000,
          limit: config.get<number>('THROTTLE_LIMIT') ?? 10,
        },
      ],
    }),
    WinstonModule.forRootAsync({
      useFactory: () => ({
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp(),
              nestWinstonModuleUtilities.format.nestLike(),
            ),
          }),
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
          }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ],
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule], // Import ConfigModule here to use ConfigService
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('BREVO_MAIL_HOST'),
          port: configService.get<number>('BREVO_MAIL_PORT'),
          secure: configService.get<number>('BREVO_MAIL_PORT') === 465, // true for 465, false for other ports (like 587)
          auth: {
            user: configService.get<string>('BREVO_MAIL_USER'),
            pass: configService.get<string>('BREVO_MAIL_PASSWORD'),
          },
          // If using port 587 (TLS), often requireExplicitTLS might be needed
          // depending on your environment/provider specifics. Brevo usually works without it.
          // requireTLS: true, // uncomment if needed
        },
        defaults: {
          from: configService.get<string>('BREVO_MAIL_FROM'),
        },
      }),
      inject: [ConfigService], // Inject ConfigService into the factory
    }),

    // additional module imports
    AuthModule,
    EmailModule,
    DatabaseModule,
    TransactionModule,
    SnapshotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

function determineEnvFilePath(): string[] {
  // return array with common envs + whatever environment is being ran
  // const envPaths: string[] = ['env/.common.env'];
  const envPaths: string[] = [];
  const env = process.env.NODE_ENV || 'development';  
  switch (env) {
    case 'development':
      envPaths.push('env/.development.local.env');
      break;
    case 'namecheap_production':
      envPaths.push('env/.namecheap.production.env');
      break;
    case 'docker-production':
      envPaths.push('env/.docker.production.env');
      break;
    case 'nginx-production':
      envPaths.push('env/.nginx.production.env');
      break;
    default:
      envPaths.push('env/.development.local.env');
  }

  return envPaths;
}
