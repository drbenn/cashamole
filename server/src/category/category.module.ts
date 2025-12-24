import { forwardRef, Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from 'src/database/database.module';
import { AuthModule } from 'src/auth/auth.module';
import { CategoryQueryService } from './category-query.service';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    forwardRef(() => AuthModule)
  ],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryQueryService],
  exports: [CategoryService]
})
export class CategoryModule {}
