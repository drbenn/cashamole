import { BadRequestException, Body, Controller, Inject, Logger, Param, Patch, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { SnapshotLiabilityDto, ServiceCreateSnapshotLiabilityDto } from '@common-types';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import * as CommonTypes from '@common-types'
import { SnapshotLiabilityService } from './liabilities.service';
import { ProactiveRefreshGuard } from 'src/auth/jwt-guard/proactive-jwt.guard';
import { StripUserIdInterceptor } from 'src/interceptors/strip-user-id.interceptor';

@UseGuards(ProactiveRefreshGuard)
@UseInterceptors(StripUserIdInterceptor)
@Controller('snapshot/liabilities')
export class SnapshotLiabilityController {
  constructor(
    private readonly snapshotLiabilityService: SnapshotLiabilityService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  // =================================================================
  // POST /snapshot-liability (CREATE - Minimal Payload)
  // Purpose: Creates a blank liability line item linked to a header.
  // =================================================================
  @Post()
  async createSnapshotLiability(
    @Body() dto: CommonTypes.CreateSnapshotLiabilityDto, // Expects only { snapshot_id }
    @Req() req: { user: CommonTypes.UserJwtGuardPayload },
  ): Promise<SnapshotLiabilityDto> {
    
    // Basic input validation
    if (!dto.snapshot_id) {
        throw new BadRequestException('The body must include "snapshot_id" to link the new liability.');
    }

    // Build the internal service DTO, injecting the security context
    const serviceDto: ServiceCreateSnapshotLiabilityDto = {
        snapshot_id: dto.snapshot_id,
        user_id: req.user.userId,     // Sourced securely from JWT
    };

    this.logger.log(`Request to create new liability for header ${dto.snapshot_id}`, SnapshotLiabilityController.name);

    return await this.snapshotLiabilityService.createLiability(serviceDto);
  }

  // =================================================================
  // PATCH /snapshot-liability/:id (PRECISE FIELD-LEVEL UPDATE)
  // Purpose: Updates a single field (e.g., amount, title) on a specific liability.
  // =================================================================
  @Patch(':id')
  async updateSnapshotLiability(
    @Param('id') liabilityId: string,
    @Body() dto: CommonTypes.UpdateSnapshotLiabilityFieldDto,
    @Req() req: { user: CommonTypes.UserJwtGuardPayload },
  ): Promise<SnapshotLiabilityDto> {

    if (!dto.field || typeof dto.value === 'undefined' || !dto.snapshot_id) {
        throw new BadRequestException('Update payload must include "field", "value", and "snapshot_id".');
    }
    
    // Defensive check against unauthorized field updates
    const forbiddenFields = ['id', 'user_id', 'created_at', 'snapshot_id', 'entity_type'];
    if (forbiddenFields.includes(dto.field as string)) {
      this.logger.warn(`Security Block: User ${req.user.userId} tried to modify restricted field: ${dto.field}`);
      throw new BadRequestException(`The field "${dto.field}" cannot be modified.`);
    }

    this.logger.log(`Request to update liability ID ${liabilityId} field ${dto.field}`, SnapshotLiabilityController.name);

    return await this.snapshotLiabilityService.updateLiability(
      liabilityId,
      req.user.userId,           // User ID from JWT
      dto.snapshot_id,           // Header ID from Body (for double verification)
      dto.field as string,       // The name of the field to update
      dto.value,                 // The new value
    );
  }

  // =================================================================
  // PATCH /snapshot-liability/:id/deactivate (DEACTIVATE/SOFT DELETE)
  // Purpose: Sets the 'active' flag to FALSE.
  // =================================================================
  @Patch(':id/deactivate')
  async deactivateSnapshotLiability(
    @Param('id') liabilityId: string,
    @Req() req: { user: CommonTypes.UserJwtGuardPayload },
  ): Promise<SnapshotLiabilityDto> {
    
    this.logger.log(`Request to deactivate liability ID ${liabilityId}`, SnapshotLiabilityController.name);

    return await this.snapshotLiabilityService.deactivateLiability(
      liabilityId,
      req.user.userId,
    );
  }
}
