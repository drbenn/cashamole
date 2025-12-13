import { SnapshotAssetDto } from '@common-types';
import { BadRequestException, Body, Controller, Inject, Logger, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { SnapshotAssetService } from './assets.service';
import * as CommonTypes from '@common-types'
import { JwtGuard } from 'src/auth/jwt-guard/guards';

@UseGuards(JwtGuard)
@Controller('snapshot/assets')
export class AssetsController {
    constructor(
      private readonly snapshotAssetService: SnapshotAssetService,
      @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
    ) {}

// =================================================================
  // POST /snapshot-asset (CREATE)
  // =================================================================
  @Post()
  async createSnapshotAsset(
    @Body() dto: CommonTypes.CreateSnapshotItemDto,
    @Req() req: { user: CommonTypes.UserJwtGuardPayload },
  ): Promise<SnapshotAssetDto> {
    
    if (dto.category !== 'asset') {
        throw new BadRequestException('Category must be "asset" for this endpoint.');
    }
    if (!dto.snapshot_id) {
        throw new BadRequestException('snapshot_id is required.');
    }

    const serviceDto: CommonTypes.ServiceCreateSnapshotItemDto = {
        snapshot_id: dto.snapshot_id,
        category: dto.category,
        user_id: req.user.userId,
    };

    return await this.snapshotAssetService.createAsset(serviceDto);
  }

  // =================================================================
  // PATCH /snapshot-asset/:id (PRECISE FIELD-LEVEL UPDATE)
  // =================================================================
  @Patch(':id')
  async updateSnapshotAsset(
    @Param('id') assetId: string,
    @Body() dto: CommonTypes.UpdateSnapshotAssetFieldDto,
    @Req() req: { user: CommonTypes.UserJwtGuardPayload },
  ): Promise<SnapshotAssetDto> {

    if (!dto.field || typeof dto.value === 'undefined' || !dto.snapshot_id) {
        throw new BadRequestException('Update payload must include "field", "value", and "snapshot_id".');
    }
    
    // NOTE: Service/Query must handle forbidden fields, but adding a check here is defensive.
    
    return await this.snapshotAssetService.updateAsset(
      assetId,
      req.user.userId,
      dto.snapshot_id,
      dto.field as string, 
      dto.value,
    );
  }

  // =================================================================
  // PATCH /snapshot-asset/:id/deactivate (DEACTIVATE/SOFT DELETE)
  // =================================================================
  @Patch(':id/deactivate')
  async deactivateSnapshotAsset(
    @Param('id') assetId: string,
    @Req() req: { user: CommonTypes.UserJwtGuardPayload },
  ): Promise<SnapshotAssetDto> {
    
    return await this.snapshotAssetService.deactivateAsset(
      assetId,
      req.user.userId,
    );
  }
}
