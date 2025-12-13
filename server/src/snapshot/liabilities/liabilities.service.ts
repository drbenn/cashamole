import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { SnapshotLiabilityQueryService } from './liabilties-query.service';
import { SnapshotLiabilityDto, ServiceCreateSnapshotLiabilityDto } from '@common-types';

@Injectable()
export class SnapshotLiabilityService {
  constructor(
    private readonly snapshotLiabilityQueryService: SnapshotLiabilityQueryService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}


  /**
   * Cleans the DTO returned from the database layer by stripping the user_id field.
   * This is a critical security and payload cleanup step.
   * @param liability The liability object returned from the database.
   * @returns The public-facing SnapshotLiabilityDto.
   */
  private cleanDto(liability: any): SnapshotLiabilityDto {
    // Destructure user_id away and keep the rest of the fields
    const { user_id, ...cleanedDto } = liability;
    // Note: We assert the type here, as we know the base fields match SnapshotLiabilityDto
    return cleanedDto as SnapshotLiabilityDto; 
  }

  // =================================================================
  // CREATE
  // =================================================================
  async createLiability(dto: ServiceCreateSnapshotLiabilityDto): Promise<SnapshotLiabilityDto> {
    
    this.logger.log(`Attempting to create new liability for header ${dto.snapshot_id} by user ${dto.user_id}`, SnapshotLiabilityService.name);
    
    try {
      const resultFromDb = await this.snapshotLiabilityQueryService.createLiability(dto);
      // Transform/Cleanup before returning
      return this.cleanDto(resultFromDb); 
    } catch (error) {
      this.logger.error(`Error creating liability: ${error.message}`, SnapshotLiabilityService.name, error.stack);
      
      // Translating specific PostgreSQL Foreign Key Violation code (23503)
      if (error.code === '23503') { 
        throw new BadRequestException('The provided snapshot_id is invalid or unauthorized (FK Constraint Failed).');
      }
      throw new BadRequestException('Failed to create snapshot liability due to a system error.');
    }
  }

  // =================================================================
  // UPDATE (PRECISE FIELD-LEVEL UPDATE)
  // =================================================================
  async updateLiability(
    liabilityId: string, 
    userId: string, 
    snapshotId: string, 
    field: string, 
    value: any
  ): Promise<SnapshotLiabilityDto> {
    
    const updatedLiability = await this.snapshotLiabilityQueryService.updateLiability(
      liabilityId, 
      userId, 
      snapshotId, 
      field, 
      value
    );

    if (!updatedLiability) {
      // Thrown if the record is not found, unauthorized, or the IDs don't match (due to WHERE clause)
      throw new NotFoundException(`Liability with ID "${liabilityId}" not found, unauthorized, or not part of Snapshot "${snapshotId}".`);
    }

    this.logger.log(`Updated liability ID ${liabilityId} field ${field} for user ${userId}.`, SnapshotLiabilityService.name);
    // Transform/Cleanup before returning
    return this.cleanDto(updatedLiability);
  }
  
  // =================================================================
  // DEACTIVATE
  // =================================================================
  async deactivateLiability(liabilityId: string, userId: string): Promise<SnapshotLiabilityDto> {
    const updatedLiability = await this.snapshotLiabilityQueryService.deactivateLiability(liabilityId, userId);

    if (!updatedLiability) {
        // Thrown if the record is not found or unauthorized.
        throw new NotFoundException(`Liability with ID "${liabilityId}" not found or unauthorized.`);
    }

    this.logger.log(`Deactivated liability ID ${liabilityId} for user ${userId}.`, SnapshotLiabilityService.name);
    // Transform/Cleanup before returning
    return this.cleanDto(updatedLiability);
  }
}

