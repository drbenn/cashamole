import { BadRequestException, Body, Controller, Get, Inject, Logger, Param, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { SnapshotService } from './snapshot.service'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import * as CommonTypes from '@common-types'
import { JwtGuard } from 'src/auth/jwt-guard/guards'; // KEEP THIS IMPORT (For TypeScript/Decorator)

@UseGuards(JwtGuard) // Applied to all controller endpoints
@Controller('snapshot')
export class SnapshotController {
  constructor(
    private readonly snapshotService: SnapshotService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  
  @Post()
  async createSnapshotHeader(
    @Body() dto: CommonTypes.CreateSnapshotHeaderDto, // Use the slim DTO
    @Req() req: { user: CommonTypes.UserJwtGuardPayload }, // Type req to access the verified user payload
    // Removed @Res because it's not needed for a simple POST unless custom headers are mandatory
  ): Promise<CommonTypes.SnapshotHeaderDto | any> {      
    // 1. Get the VERIFIED user ID from the token payload
    const verifiedUserId = req.user.userId;
    
    console.log(dto.snapshot_date);
    
    // 2. Construct the DTO required by the service (using the verified ID)
    const serviceDto: CommonTypes.CreateSnapshotHeaderApiDto = {
      user_id: verifiedUserId,
      snapshot_date: new Date(dto.snapshot_date)
    };      

    // 3. Call the service layer with the fully trusted DTO
    return await this.snapshotService.createSnapshotHeader(serviceDto);
  }

  @Get(':id')
  async getSnapshotDetail(
    @Param('id') snapshotId: string,
    @Req() req: { user: CommonTypes.UserJwtGuardPayload },
  ): Promise<CommonTypes.SnapshotDetailDto> {
    
    // 1. Get the authenticated user ID
    const userId = req.user.userId;

    this.logger.log(`Requesting snapshot detail for ID: ${snapshotId} by user ${userId}`, SnapshotController.name);

    // 2. Call the service (which handles Not Found errors)
    return await this.snapshotService.getSnapshotDetail(snapshotId, userId);
  }

  @Patch(':id/deactivate') // Matches PATCH /snapshot/:id/deactivate
  async deactivateSnapshotHeader(
    @Param('id') snapshotId: string,
    @Req() req: { user: CommonTypes.UserJwtGuardPayload },
  ): Promise<CommonTypes.SnapshotHeaderDto> {
    
    const userId = req.user.userId;

    return await this.snapshotService.deactivateSnapshotHeader(snapshotId, userId);
  }

  @Patch(':id/date') // Matches PATCH /snapshot/:id/date
  async updateSnapshotDate(
    @Param('id') snapshotId: string,
    @Body() dto: CommonTypes.UpdateSnapshotDateDto,
    @Req() req: { user: CommonTypes.UserJwtGuardPayload },
  ): Promise<CommonTypes.SnapshotHeaderDto> {
    
    const userId = req.user.userId;
    
    // 1. Validate and convert the input string to a Date object
    const newDate = new Date(dto.snapshot_date);
    if (isNaN(newDate.getTime())) {
      throw new BadRequestException('Invalid snapshot_date format provided.');
    }

    // 2. Call the service
    return await this.snapshotService.updateSnapshotDate(snapshotId, userId, newDate);
  }
}