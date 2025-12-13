import { Module } from '@nestjs/common';
import { SnapshotController } from './snapshot.controller';
import { SnapshotService } from './snapshot.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from 'src/database/database.module';
import { SnapshotQueryService } from './snapshot-query.service';
import { AuthModule } from 'src/auth/auth.module';
import { SnapshotAssetController } from './assets/assets.controller';
import { SnapshotLiabilityController } from './liabilities/liabilities.controller';
import { SnapshotAssetService } from './assets/assets.service';
import { SnapshotAssetQueryService } from './assets/assets-query.service';
import { SnapshotLiabilityService } from './liabilities/liabilities.service';
import { SnapshotLiabilityQueryService } from './liabilities/liabilties-query.service';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule          // for accessing jwt through guard
  ],
  controllers: [
    SnapshotController,
    SnapshotAssetController,
    SnapshotLiabilityController
  ],
  providers: [
    SnapshotService,
    SnapshotQueryService,
    SnapshotAssetService,
    SnapshotAssetQueryService,
    SnapshotLiabilityService,
    SnapshotLiabilityQueryService
  ]
})
export class SnapshotModule {}
