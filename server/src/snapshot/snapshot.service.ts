import { Inject, Injectable, Logger } from '@nestjs/common';
import { SnapshotQueryService } from './snapshot-query.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DeactivateSnapshotDto, FetchSnapshotsDto, SnapshotDto, UpdateSnapshotFieldDto } from '@common-types';

@Injectable()
export class SnapshotService {
  constructor(
    private readonly snapshotQueryService: SnapshotQueryService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async createSnapshot(dto: SnapshotDto): Promise<SnapshotDto> {
    return await this.snapshotQueryService.insertSnapshot(dto)
  }

  async getAllUserSnapshots(dto: FetchSnapshotsDto): Promise<SnapshotDto[]> {
    return await this.snapshotQueryService.getAllUserSnapshots(dto)
  }

  async updateSnapshotField(dto: UpdateSnapshotFieldDto): Promise<UpdateSnapshotFieldDto> {
    return await this.snapshotQueryService.updateSnapshotField(dto)
  }

  async deactivateSnapshot(dto: DeactivateSnapshotDto): Promise<DeactivateSnapshotDto> {
    return await this.snapshotQueryService.deactivateSnapshot(dto)
  }
}
