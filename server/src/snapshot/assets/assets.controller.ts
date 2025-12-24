import { SnapshotAssetDto } from '@common-types';
import { BadRequestException, Body, Controller, Inject, Logger, Param, Patch, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { SnapshotAssetService } from './assets.service';
import * as CommonTypes from '@common-types'
import { ProactiveRefreshGuard } from 'src/auth/jwt-guard/proactive-jwt.guard';
import { StripUserIdInterceptor } from 'src/interceptors/strip-user-id.interceptor';

@UseGuards(ProactiveRefreshGuard)
@UseInterceptors(StripUserIdInterceptor)
@Controller('snapshot/assets')
export class SnapshotAssetController {
  constructor(
    private readonly snapshotAssetService: SnapshotAssetService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

// =================================================================
  // POST /snapshot-asset (CREATE)
  // =================================================================
  @Post()
  async createSnapshotAsset(
    @Body() dto: CommonTypes.CreateSnapshotAssetDto,
    @Req() req: { user: CommonTypes.UserJwtGuardPayload },
  ): Promise<SnapshotAssetDto> {
    
    if (!dto.snapshot_id) {
        throw new BadRequestException('snapshot_id is required.');
    }

    const serviceDto: CommonTypes.ServiceCreateSnapshotAssetDto = {
        snapshot_id: dto.snapshot_id,
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
    
    /**
     * SECURITY LOCKDOWN
     * We allow category_id so users can re-organize their assets.
     * We FORBID changing the core DNA of the record.
     */
    const forbiddenFields = [
      'id', 
      'user_id', 
      'snapshot_id', 
      'entity_type', // An asset stays an asset
      'created_at'
    ];
    
    if (forbiddenFields.includes(dto.field as string)) {
        this.logger.warn(
          `Security Alert: User ${req.user.userId} attempted to patch restricted field: ${dto.field}`, 
          SnapshotAssetController.name
        );
        throw new BadRequestException(`Updating the field "${dto.field}" is strictly prohibited.`);
    }

    this.logger.log(`Updating asset ID ${assetId} field ${dto.field}`, SnapshotAssetController.name);

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
