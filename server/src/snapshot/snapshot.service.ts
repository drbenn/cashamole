import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { SnapshotQueryService } from './snapshot-query.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { CreateSnapshotHeaderApiDto, CreateSnapshotHeaderDto, SnapshotHeaderDto } from '@common-types';


@Injectable()
export class SnapshotService {
  constructor(
    private readonly snapshotQueryService: SnapshotQueryService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

async createSnapshotHeader(dto: CreateSnapshotHeaderApiDto): Promise<SnapshotHeaderDto> {
    const { user_id, snapshot_date } = dto;
    const methodName = SnapshotService.name + '.createSnapshotHeader';

    this.logger.log(
      `Attempting to create snapshot for user ${user_id} on date ${snapshot_date}`, 
      methodName
    );

    // 1. Uniqueness Check: Find if a header already exists
    const existingHeader = await this.snapshotQueryService.findHeaderByDateAndUser(dto);

    if (existingHeader) {
      // If found, throw a 409 Conflict error, preventing duplicate insertion
      this.logger.warn(
        `Snapshot creation failed: Entry already exists for user ${user_id} on ${snapshot_date}`, 
        methodName
      );
      // NestJS will automatically convert ConflictException to a 409 HTTP response
      throw new ConflictException(`A snapshot header already exists for the date ${snapshot_date}.`);
    }

    // 2. Creation: Proceed only if unique
    const newHeader = await this.snapshotQueryService.createHeader(dto);

    const cleanHeader: SnapshotHeaderDto = {
        ...newHeader,
        // simple date '2025-12-16' for succinct response
        snapshot_date: new Date(newHeader.snapshot_date).toISOString().split('T')[0], 
    };
    
    this.logger.log(`Successfully created new snapshot header ID: ${newHeader.id}`, methodName);

    return cleanHeader;
  }
}

