import { ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { SnapshotQueryService } from './snapshot-query.service'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { CreateSnapshotHeaderApiDto, CreateSnapshotHeaderDto, SnapshotDetailDto, SnapshotHeaderDto } from '@common-types'


@Injectable()
export class SnapshotService {
  constructor(
    private readonly snapshotQueryService: SnapshotQueryService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async createSnapshotHeader(dto: CreateSnapshotHeaderApiDto): Promise<SnapshotHeaderDto> {
    const { user_id, snapshot_date } = dto
    const methodName = SnapshotService.name + '.createSnapshotHeader'

    this.logger.log(
      `Attempting to create snapshot for user ${user_id} on date ${snapshot_date}`, 
      methodName
    )

    // 1. Uniqueness Check: Find if a header already exists
    const existingHeader = await this.snapshotQueryService.findHeaderByDateAndUser(dto.user_id, dto.snapshot_date)

    if (existingHeader) {
      // If found, throw a 409 Conflict error, preventing duplicate insertion
      this.logger.warn(
        `Snapshot creation failed: Entry already exists for user ${user_id} on ${snapshot_date}`, 
        methodName
      )
      // NestJS will automatically convert ConflictException to a 409 HTTP response
      throw new ConflictException(`A snapshot header already exists for the date ${snapshot_date}.`)
    }

    // 2. Creation: Proceed only if unique
    const newHeader = await this.snapshotQueryService.createHeader(dto)

    const cleanHeader: SnapshotHeaderDto = {
        ...newHeader,
        // simple date '2025-12-16' for succinct response
        snapshot_date: new Date(newHeader.snapshot_date).toISOString().split('T')[0], 
    }
    
    this.logger.log(`Successfully created new snapshot header ID: ${newHeader.id}`, methodName)

    return cleanHeader
  }

  async getSnapshotDetail(snapshotId: string, userId: string): Promise<SnapshotDetailDto> {
    const detail = await this.snapshotQueryService.findSnapshotDetailById(snapshotId, userId)
    
    if (!detail) {
      // NestJS automatically converts this to a 404 HTTP response
      throw new NotFoundException(`Snapshot with ID "${snapshotId}" not found or unauthorized.`)
    }

    this.logger.log(`Retrieved snapshot ID ${snapshotId} for user ${userId}.`, SnapshotService.name)

    return detail
  }

  async deactivateSnapshotHeader(snapshotId: string, userId: string): Promise<SnapshotHeaderDto> {
    const updatedHeader = await this.snapshotQueryService.deactivateHeader(snapshotId, userId)

    if (!updatedHeader) {
        throw new NotFoundException(`Snapshot with ID "${snapshotId}" not found or unauthorized.`)
    }

    this.logger.log(`Deactivated snapshot ID ${snapshotId} for user ${userId}.`, SnapshotService.name)
    return updatedHeader
  }


  async updateSnapshotDate(
    snapshotId: string, 
    userId: string, 
    newDate: Date
  ): Promise<SnapshotHeaderDto> {
    const newDateString = newDate.toISOString().split('T')[0] // YYYY-MM-DD
    
    // 1. Uniqueness Check: Find if another active snapshot already uses the new date
    const conflictingHeader = await this.snapshotQueryService.findHeaderByDateAndUser(
        userId, 
        newDate // Pass the Date object
    )

    // Conflict check logic:
    // If a header is found AND that header is NOT the header we are trying to update, throw Conflict.
    if (conflictingHeader && conflictingHeader.id !== snapshotId) {
      throw new ConflictException(`Cannot update: A snapshot already exists for the date ${newDateString}.`)
    }

    // 2. Perform the update
    const updatedHeader = await this.snapshotQueryService.updateHeaderDate(
        snapshotId, 
        userId, 
        newDateString
    )

    if (!updatedHeader) {
        throw new NotFoundException(`Snapshot with ID "${snapshotId}" not found or unauthorized.`)
    }

    this.logger.log(`Updated date for snapshot ID ${snapshotId} to ${newDateString}.`, SnapshotService.name)
    return updatedHeader
  }

  async getDashboardSummary(userId: string): Promise<any> {
    return await this.snapshotQueryService.getFullDashboardSummary(userId)
  }
}

