import { CreateUserDto } from '@common-types';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Pool } from 'pg';
import { PG_CONNECTION } from 'src/database/database.constants';

    // try {
    //   const result = await this.pgPool.query('SELECT id, email FROM users WHERE id = $1', [id]);
    //   return result.rows[0];
    // } catch (error: Error | unknown) {

    // }
    
@Injectable()
export class AuthQueryService {
  // Inject the singleton Pool instance
  constructor(
    @Inject(PG_CONNECTION) private pgPool: Pool,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async findUserByEmail(email: string): Promise<any> {
    try {
      const result = await this.pgPool.query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0];
    } catch (error) {
      console.error('Database query error:', error);
      this.logger.log('warn', `Error: auth-query-service findUserByEmail: ${error}`);
      throw new Error('Error: auth-query-service findUserByEmail');
    }
  }

  async checkIsExistingEmail(email: string): Promise<any> {
    try {
      const result = await this.pgPool.query('SELECT email FROM users WHERE email = $1', [email]);
      console.log('is exist email: ', result.rows[0]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Database query error:', error);
      this.logger.log('warn', `Error: auth-query-service checkIsExistingEmail: ${error}`);
      throw new Error('Error: auth-query-service checkIsExistingEmail');
    }
  }

  async findUserPasswordByEmail(email: string): Promise<any> {
    try {
      const result = await this.pgPool.query('SELECT providers FROM users WHERE email = $1', [email]);
      console.log('rizzult: ', result.rows[0].providers.email.password);
      
      return result.rows[0].providers.email.password
    } catch (error) {
      console.error('Database query error:', error);
      this.logger.log('warn', `Error: auth-query-service findUserPasswordByEmail: ${error}`);
      throw new Error('Error: auth-query-service findUserPasswordByEmail');
    }
  }

  async insertUser(user: CreateUserDto): Promise<any> {
    const refreshToken: string = '6a5s1dfasdf651'
    const providerKey: string = user.provider

    const initialProviders: Record<string, any> = {
      [providerKey]: {
        provider: providerKey,
        verified: false,
        verifiedAt: new Date().toISOString(), // Use current ISO timestamp
        password: user.password
      },
    };

    const queryText = `
      INSERT INTO "users" (email, providers, profiles, settings)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, created_at;
    `;

    const values = [
      user.email,                               // $1: email (VARCHAR)
      initialProviders,                         // $2: providers (JSONB object)
      {},                                       // $3: profiles (empty object for JSONB)
      {},                                       // $4: settings (empty object for JSONB)
    ];

    try {
      const result = await this.pgPool.query(queryText, values);      
      return result.rows[0];
    } catch (error) {
      this.logger.log('warn', `Error: auth-query-service insertUser: ${error}`);
      throw new Error('Error: auth-query-service insertUser');
    }
  }

  async insertRefreshTokenHash(
    hashedRefreshToken: string,
    userId: string,
    expirationDate: Date
  ): Promise<any> {

    const queryText = `
      INSERT INTO "user_refresh_tokens" (token_hash, user_id, expires_at)
      VALUES ($1, $2, $3);
    `;

    const values = [
      hashedRefreshToken,
      userId,
      expirationDate,
    ];

    try {
      const result = await this.pgPool.query(queryText, values);      
      return result.rows[0];
    } catch (error) {
      this.logger.log('warn', `Error: auth-query-service insertRefreshTokenHash: ${error}`);
      throw new Error('Error: auth-query-service insertRefreshTokenHash');
    }
  }
}
