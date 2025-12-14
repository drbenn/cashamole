import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from 'src/database/database.module';
import { TransactionQueryService } from './transaction-query.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule
  ],
  controllers: [TransactionController],
  providers: [TransactionService, TransactionQueryService]
})
export class TransactionModule {}
