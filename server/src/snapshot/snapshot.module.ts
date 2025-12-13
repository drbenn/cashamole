import { Module } from '@nestjs/common';
import { SnapshotController } from './snapshot.controller';
import { SnapshotService } from './snapshot.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from 'src/database/database.module';
import { SnapshotQueryService } from './snapshot-query.service';
import { AssetsController } from './assets/assets.controller';
import { LiabilitiesController } from './liabilities/liabilities.controller';
import { AssetsService } from './assets/assets.service';
import { AssetQueryService } from './assets/assets-query.service';
import { LiabilitiesService } from './liabilities/liabilities.service';
import { LiabilitiesQueryService } from './liabilities/liabilties-query.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule          // for accessing jwt through guard
  ],
  controllers: [
    SnapshotController,
    AssetsController,
    LiabilitiesController
  ],
  providers: [
    SnapshotService,
    SnapshotQueryService,
    AssetsService,
    AssetQueryService,
    LiabilitiesService,
    LiabilitiesQueryService
  ]
})
export class SnapshotModule {}
