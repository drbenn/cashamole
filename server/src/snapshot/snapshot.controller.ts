import { Body, Controller, Inject, Logger, Param, Patch, Post, Req, Res } from '@nestjs/common'
import { SnapshotService } from './snapshot.service'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import * as CommonTypes from '@common-types'

@Controller('snapshot')
export class SnapshotController {
  constructor(
    private readonly snapshotService: SnapshotService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  @Post()
  async createSnapshot(
    @Body() dto: CommonTypes.SnapshotDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CommonTypes.SnapshotDto> {
    return await this.snapshotService.createSnapshot(dto)
  }

  @Post('all-user')
  async allUserSnapshots(
    @Body() dto: CommonTypes.FetchSnapshotsDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CommonTypes.SnapshotDto[]> {
    return await this.snapshotService.getAllUserSnapshots(dto)
  }

  @Patch(':id')
  async updateSnapshotField(
    @Body() dto: CommonTypes.UpdateSnapshotFieldDto,
    @Req() req: Request,
    @Param() params: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CommonTypes.UpdateSnapshotFieldDto> {
    const snapshotId: string = params.id
    return await this.snapshotService.updateSnapshotField(dto)
  }

  @Patch('deactivate/:id')
  async deactivateSnapshot(
    @Body() dto: CommonTypes.DeactivateSnapshotDto,
    @Req() req: Request,
    @Param() params: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CommonTypes.DeactivateSnapshotDto> {
    const snapshotId: string = params.id
    return await this.snapshotService.deactivateSnapshot(dto)
  }

}
