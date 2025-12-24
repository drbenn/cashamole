import { CategoryDto, UpdateCategoryDto } from '@common-types'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Pool } from 'pg'
import { PG_CONNECTION } from 'src/database/database.constants'

@Injectable()
export class CategoryQueryService {
  // Inject the singleton Pool instance
  constructor(
    @Inject(PG_CONNECTION) private pgPool: Pool,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async insertSystemCategories(categories: any[], userId: string): Promise<void> {
    const client = await this.pgPool.connect();
    
    try {
      await client.query('BEGIN');

      const queryText = `
        INSERT INTO categories (id, user_id, name, usage_type, sort_order, is_system, active)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `;

      for (const cat of categories) {
        const values = [
          cat.id,
          userId,
          cat.name,
          cat.usage_type,
          cat.sort_order,
          cat.is_system,
          true // active
        ];
        await client.query(queryText, values);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.log('error', `Error: categories-query-service insertSystemCategories: ${error}`);
      throw new Error('Error: categories-query-service insertSystemCategories');
    } finally {
      client.release();
    }
  }

  async createCategory(data: any, userId: string): Promise<CategoryDto> {
    const queryText = `
      INSERT INTO categories (id, user_id, name, usage_type, sort_order)
      VALUES ($1, $2, $3, $4, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories WHERE user_id = $2))
      RETURNING *;
    `
    const values = [data.id, userId, data.name, data.usage_type]

    try {
      const result = await this.pgPool.query(queryText, values)
      return result.rows[0]
    } catch (error) {
      this.logger.error(`Error: categories-query-service createCategory: ${error}`)
      throw new Error('Error: categories-query-service createCategory')
    }
  }

  async findByNameAndType(name: string, type: string, userId: string): Promise<CategoryDto | null> {
    const queryText = `
      SELECT * FROM categories 
      WHERE name = $1 AND usage_type = $2 AND user_id = $3 AND active = true;
    `
    const values = [name, type, userId]

    try {
      const result = await this.pgPool.query(queryText, values)
      return result.rows[0] || null
    } catch (error) {
      this.logger.error(`Error: categories-query-service findByNameAndType: ${error}`)
      throw new Error('Error: categories-query-service findByNameAndType')
    }
  }

  async getCategoryById(id: string, userId: string): Promise<CategoryDto | null> {
    const queryText = `SELECT * FROM categories WHERE id = $1 AND user_id = $2;`
    const values = [id, userId]

    try {
      const result = await this.pgPool.query(queryText, values)
      return result.rows[0] || null
    } catch (error) {
      this.logger.error(`Error: categories-query-service getCategoryById: ${error}`)
      throw new Error('Error: categories-query-service getCategoryById')
    }
  }

  async updateCategory(dto: UpdateCategoryDto, userId: string): Promise<CategoryDto> {
    const queryText = `
      UPDATE categories 
      SET 
        name = COALESCE($1, name),
        sort_order = COALESCE($2, sort_order),
        active = COALESCE($3, active),
        updated_at = NOW()
      WHERE id = $4 AND user_id = $5
      RETURNING *;
    `
    const values = [dto.name, dto.sort_order, dto.active, dto.id, userId]

    try {
      const result = await this.pgPool.query(queryText, values)
      return result.rows[0]
    } catch (error) {
      this.logger.error(`Error: categories-query-service updateCategory: ${error}`)
      throw new Error('Error: categories-query-service updateCategory')
    }
  }

  async bulkUpdateOrder(categoryIds: string[], userId: string): Promise<void> {
    const queryText = `
      UPDATE categories AS c
      SET sort_order = x.pos, updated_at = NOW()
      FROM (
        SELECT unnest($1::uuid[]) AS id, generate_series(1, array_length($1::uuid[], 1)) AS pos
      ) AS x
      WHERE c.id = x.id AND c.user_id = $2;
    `
    const values = [categoryIds, userId]

    try {
      await this.pgPool.query(queryText, values)
    } catch (error) {
      this.logger.error(`Error: categories-query-service bulkUpdateOrder: ${error}`)
      throw new Error('Error: categories-query-service bulkUpdateOrder')
    }
  }

  async migrateAndDeactivate(categoryId: string, fallbackId: string, userId: string): Promise<void> {
    const client = await this.pgPool.connect()
    try {
      await client.query('BEGIN')

      // 1. Move Transactions
      await client.query(
        `UPDATE transactions SET category_id = $1 WHERE category_id = $2 AND user_id = $3;`,
        [fallbackId, categoryId, userId]
      )

      // 2. Move Assets
      await client.query(
        `UPDATE snapshot_assets SET category_id = $1 WHERE category_id = $2;`,
        [fallbackId, categoryId]
      )

      // 3. Move Liabilities
      await client.query(
        `UPDATE snapshot_liabilities SET category_id = $1 WHERE category_id = $2;`,
        [fallbackId, categoryId]
      )

      // 4. Deactivate the category
      await client.query(
        `UPDATE categories SET active = false, updated_at = NOW() WHERE id = $1 AND user_id = $2;`,
        [categoryId, userId]
      )

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      this.logger.error(`Error: categories-query-service migrateAndDeactivate: ${error}`)
      throw new Error('Error: categories-query-service migrateAndDeactivate')
    } finally {
      client.release()
    }
  }

  async getUserCategories(userId: string): Promise<CategoryDto[]> {
    const queryText = `
      SELECT * FROM categories 
      WHERE user_id = $1 AND active = true 
      ORDER BY sort_order ASC;
    `
    const values = [userId]

    try {
      const result = await this.pgPool.query(queryText, values)
      return result.rows
    } catch (error) {
      this.logger.error(`Error: categories-query-service getUserCategories: ${error}`)
      throw new Error('Error: categories-query-service getUserCategories')
    }
  }

}
