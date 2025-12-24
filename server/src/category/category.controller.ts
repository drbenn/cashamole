import { Body, Controller, Get, Inject, Logger, Patch, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { ProactiveRefreshGuard } from 'src/auth/jwt-guard/proactive-jwt.guard'
import { StripUserIdInterceptor } from 'src/interceptors/strip-user-id.interceptor'
import * as CommonTypes from '@common-types'
import { CategoryService } from './category.service'

@UseGuards(ProactiveRefreshGuard) // Applied to all controller endpoints
@UseInterceptors(StripUserIdInterceptor)
@Controller('category')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}


  @Post()
  async createCategory(
    @Body() dto: CommonTypes.CreateCategoryDto,
    @Req() req: { user: CommonTypes.UserJwtGuardPayload },
  ): Promise<CommonTypes.CategoryDto> {
    const verifiedUserId = req.user.userId
    return await this.categoryService.createCategory(dto, verifiedUserId)
  }

  @Get()
  async getUserCategories(
    @Req() req: { user: CommonTypes.UserJwtGuardPayload },
  ): Promise<CommonTypes.CategoryDto[]> {
    const verifiedUserId = req.user.userId
    return await this.categoryService.getUserCategories(verifiedUserId)
  }

  @Patch()
  async updateCategory(
    @Body() dto: CommonTypes.UpdateCategoryDto,
    @Req() req: { user: CommonTypes.UserJwtGuardPayload },
  ): Promise<CommonTypes.CategoryDto> {
    const verifiedUserId = req.user.userId
    return await this.categoryService.updateCategory(dto, verifiedUserId)
  }

  @Patch('reorder')
  async reorderCategories(
    @Body() dto: CommonTypes.ReorderCategoriesDto,
    @Req() req: { user: CommonTypes.UserJwtGuardPayload },
  ): Promise<{ success: boolean }> {
    const verifiedUserId = req.user.userId
    return await this.categoryService.reorderCategories(dto, verifiedUserId)
  }

  @Patch('deactivate')
  async deactivateCategory(
    @Body() dto: CommonTypes.DeactivateCategoryDto,
    @Req() req: { user: CommonTypes.UserJwtGuardPayload },
  ): Promise<{ success: boolean }> {
    const verifiedUserId = req.user.userId
    return await this.categoryService.deactivateCategory(dto, verifiedUserId)
  }
}
