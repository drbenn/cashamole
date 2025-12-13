import { ServiceCreateSnapshotItemDto, SnapshotAssetDto } from '@common-types/snapshot-asset.types';
import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SnapshotAssetQueryService } from './assets-query.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
export class SnapshotAssetService {
  constructor(
    private readonly snapshotAssetQueryService: SnapshotAssetQueryService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}
// =================================================================
  // CREATE
  // =================================================================
  async createAsset(dto: ServiceCreateSnapshotItemDto): Promise<SnapshotAssetDto> {
    
    this.logger.log(`Attempting to create new asset for header ${dto.snapshot_id} by user ${dto.user_id}`, SnapshotAssetService.name);
    
    try {
      return await this.snapshotAssetQueryService.createAsset(dto);
    } catch (error) {
      // We catch errors here, assuming a FK violation is the most likely failure mode 
      // if the snapshot_id is invalid or if the user_id does not match the header owner.
      this.logger.error(`Error creating asset: ${error.message}`, SnapshotAssetService.name, error.stack);
      
      // Translate the error (e.g., PostgreSQL FK violation) into a NestJS exception
      // Note: You may need more specific database error code checking here.
      if (error.code === '23503') { // PostgreSQL FK Violation code
        throw new BadRequestException('The provided snapshot_id is invalid or unauthorized.');
      }

      throw new BadRequestException('Failed to create snapshot asset due to a system error.');
    }
  }

  // =================================================================
  // UPDATE (PRECISE FIELD-LEVEL UPDATE)
  // =================================================================
  async updateAsset(
    assetId: string, 
    userId: string, 
    snapshotId: string, 
    field: string, 
    value: any
  ): Promise<SnapshotAssetDto> {
    
    const updatedAsset = await this.snapshotAssetQueryService.updateAsset(
      assetId, 
      userId, 
      snapshotId, 
      field, 
      value
    );

    if (!updatedAsset) {
      // This exception is thrown if the record is not found, unauthorized, or already inactive.
      throw new NotFoundException(`Asset with ID "${assetId}" not found, unauthorized, or not part of Snapshot "${snapshotId}".`);
    }

    this.logger.log(`Updated asset ID ${assetId} field ${field} for user ${userId}.`, SnapshotAssetService.name);
    return updatedAsset;
  }
  
  // =================================================================
  // DEACTIVATE
  // =================================================================
  async deactivateAsset(assetId: string, userId: string): Promise<SnapshotAssetDto> {
    
    const updatedAsset = await this.snapshotAssetQueryService.deactivateAsset(assetId, userId);

    if (!updatedAsset) {
      // This exception is thrown if the record is not found or unauthorized.
      throw new NotFoundException(`Asset with ID "${assetId}" not found or unauthorized.`);
    }

    this.logger.log(`Deactivated asset ID ${assetId} for user ${userId}.`, SnapshotAssetService.name);
    return updatedAsset;
  }
}
