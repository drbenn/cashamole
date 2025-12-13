// snapshot.controller.ts (Refined for Security)

import { Body, Controller, Inject, Logger, Post, Req, UseGuards } from '@nestjs/common'
import { SnapshotService } from './snapshot.service'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import * as CommonTypes from '@common-types'
import { JwtGuard } from 'src/auth/jwt-guard/guards'; // KEEP THIS IMPORT (For TypeScript/Decorator)

interface UserPayload {
    userId: string; 
}

// DTO for the body payload (does NOT include user_id)

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
      @Req() req: { user: UserPayload }, // Type req to access the verified user payload
      // Removed @Res because it's not needed for a simple POST unless custom headers are mandatory
    ): Promise<CommonTypes.SnapshotHeaderDto | any> {
      console.log('om create snapshot');
      
      // 1. Get the VERIFIED user ID from the token payload
      const verifiedUserId = req.user.userId;
      console.log('verifiedUserId" ', verifiedUserId);
      
      // 2. Construct the DTO required by the service (using the verified ID)
      const serviceDto: CommonTypes.CreateSnapshotHeaderDto = {
        user_id: verifiedUserId,
        snapshot_date: dto.snapshot_date,
      };

      console.log('serviceDto: ', serviceDto);
      
      
      this.logger.log(`User ${verifiedUserId} creating snapshot for ${dto.snapshot_date}`, SnapshotController.name);

      // 3. Call the service layer with the fully trusted DTO
      // return await this.snapshotService.createSnapshotHeader(serviceDto);
    }
}