import { Body, Controller, Inject, Logger, Post, Req, UseGuards } from '@nestjs/common'
import { SnapshotService } from './snapshot.service'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import * as CommonTypes from '@common-types'
import { JwtGuard } from 'src/auth/jwt-guard/guards'; // KEEP THIS IMPORT (For TypeScript/Decorator)

@Controller('snapshot')
export class SnapshotController {
  constructor(
    private readonly snapshotService: SnapshotService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  
  @Post()
  @UseGuards(JwtGuard) // The Guard is correctly applied here
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
}