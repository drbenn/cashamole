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
      const result = await this.pgPool.query('SELECT email FROM users WHERE email = $1', [email]);
      return result.rows[0];
    } catch (error) {
      console.error('Database query error:', error);
      this.logger.log('warn', `Error: auth-query-service findOneUser: ${error}`);
      throw new Error('Error: auth-query-service findOneUser');
    }
  }

  async insertUser(user: CreateUserDto): Promise<any> {
    const refreshToken: string = '6a5s1dfasdf651'
    const provider = user.provider

    const initialProviders = {
      provider: {
        provider: provider,
        verified: false,
        verifiedAt: new Date().toISOString(), // Use current ISO timestamp
        password: user.password
      },
    };

    const queryText = `
      INSERT INTO "users" (email, refresh_token, providers, profiles, settings)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, created_at;
    `;

    const values = [
      user.email,                               // $1: email (VARCHAR)
      refreshToken,                             // $2: refresh_token (VARCHAR)
      initialProviders,                         // $3: providers (JSONB object)
      {},                                       // $4: profiles (empty object for JSONB)
      {},                                       // $5: settings (empty object for JSONB)
    ];

    try {
      const result = await this.pgPool.query(queryText, values);      
      return result.rows[0];
    } catch (error) {
      this.logger.log('warn', `Error: auth-query-service insertUser: ${error}`);
      throw new Error('Error: auth-query-service insertUser');
    }
  }
}
