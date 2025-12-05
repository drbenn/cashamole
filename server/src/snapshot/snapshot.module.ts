import { Module } from '@nestjs/common';
import { SnapshotController } from './snapshot.controller';
import { SnapshotService } from './snapshot.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from 'src/database/database.module';
import { SnapshotQueryService } from './snapshot-query.service';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule
  ],
  controllers: [SnapshotController],
  providers: [SnapshotService, SnapshotQueryService]
})
export class SnapshotModule {}
