import { CreateUserDto, ResetPasswordDto, VerifyRegistrationDto } from '@common-types';
import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
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

  async findUserIdByEmail(email: string): Promise<string> {
    try {
      const result = await this.pgPool.query('SELECT id FROM users WHERE email = $1', [email]);
      return result.rows[0].id
    } catch (error) {
      console.error('Database query error:', error);
      this.logger.log('warn', `Error: auth-query-service findUserByEmail: ${error}`);
      throw new Error('Error: auth-query-service findUserByEmail');
    }
  }

  async findUserById(userId: string): Promise<any> {
    try {
      const result = await this.pgPool.query('SELECT * FROM users WHERE id = $1', [userId]);
      return result.rows[0];
    } catch (error) {
      console.error('Database query error:', error);
      this.logger.log('warn', `Error: auth-query-service findUserById: ${error}`);
      throw new Error('Error: auth-query-service findUserById');
    }
  }

  async checkIsExistingEmail(email: string): Promise<any> {
    try {
      const result = await this.pgPool.query('SELECT email FROM users WHERE email = $1', [email]);
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

  async insertRegisterAccountEmailConfirmation(
    userId: string,
    verificationCode: string,
    expiresAt: Date
  ): Promise<any> {
    const queryText = `
      INSERT INTO "email_confirmations" (user_id, code, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id;
    `;

    const values = [
      userId,
      verificationCode,
      expiresAt
    ];

    try {
      const result = await this.pgPool.query(queryText, values);   
      const emailConfirmationId: string = result.rows[0].id
      return emailConfirmationId
    } catch (error) {
      this.logger.log('warn', `Error: auth-query-service insertEmailConfirmation: ${error}`);
      throw new Error('Error: auth-query-service insertEmailConfirmation');
    }
  }

  async findEmailConfirmation(dto: VerifyRegistrationDto) {
    try {
      const result = await this.pgPool.query('SELECT * FROM email_confirmations WHERE code = $1 AND id = $2;', [dto.code, dto.id]);
      return result.rows[0]
    } catch (error) {
      console.error('Database query error:', error);
      this.logger.log('warn', `Error: auth-query-service findEmailConfirmation: ${error}`);
      throw new Error('Error: auth-query-service findEmailConfirmation');
    }
  }

  // must use transaction to perform both update email_confirmation and users table, both updates must succeed or none update
  async updateEmailConfirmationUsedAndVerifyUser(confirmationId: string) {
    const now = new Date();
    const usedAtTimestamp = now.toISOString();

    // Get a client from the pool to manage the transaction
    const client = await this.pgPool.connect();
    try {
      await client.query('BEGIN'); // START THE TRANSACTION
      
      // --- QUERY 1: UPDATE email_confirmations (Mark as used) ---
      const confirmationUsedAtUpdateResult = await client.query(
        `UPDATE "email_confirmations" 
        SET used_at = $1 
        WHERE id = $2 AND used_at IS NULL RETURNING user_id;`,
        [usedAtTimestamp, confirmationId]);        
        
      if (confirmationUsedAtUpdateResult.rowCount === 0) {
        // If no row was updated, the code was invalid, expired, or already used.
        // We must rollback before throwing an error.
        await client.query('ROLLBACK');
        this.logger.log('warn', `Error: auth-query-service updateEmailConfirmationUsedAndVerifyUser: Database failed to mark email as confirmed.`);
        throw new ConflictException({
          message: 'Account verification failed: Failed to confirm user email.',
          // reason: 'Verification not confirmed. Database failed to mark email as confirmed.'
        });
      }

      const userId = confirmationUsedAtUpdateResult.rows[0].user_id

      // --- QUERY 2: Check to see if user account has already been verified ---
      const IsUserVerfiedResult = await client.query(
        `SELECT id
        FROM users
        WHERE id = $1
        AND providers -> 'email' ->> 'verified' = 'true';`,
        [userId]
      )

      if (IsUserVerfiedResult.rowCount !== 0) {
        await client.query('ROLLBACK')
        this.logger.log('warn', `Error: auth-query-service updateEmailConfirmationUsedAndVerifyUser: User account already verified.`);
        throw new ConflictException({
          message: 'Account verification failed: User account already verified.',
          // reason: 'User account already verified.'
        });
      }

      // --- QUERY 3: UPDATE users (Set verified status) ---
      // We use the JSONB operator || (concatenation) to merge a new value deep into the object
      const userUpdateResult = await client.query(
        `UPDATE "users" 
        SET providers = jsonb_set(
          providers,                                       -- The JSONB column to update
          '{email, verified}',                             -- The path to the key (['email', 'verified'])
          'true'::jsonb,                                   -- The new value, cast to jsonb
          true                                             -- The create_missing flag (true = create keys if they don't exist)
        ),
        updated_at = $1
        WHERE id = $2
        RETURNING *;`,
        [usedAtTimestamp, userId]
      );

      if (userUpdateResult.rowCount === 0) {
        // Highly unlikely to fail if the user was found earlier, but good for atomicity
        await client.query('ROLLBACK');
        this.logger.log('warn', `Error: auth-query-service updateEmailConfirmationUsedAndVerifyUser: User verified status not updated.`);
        throw new ConflictException({
          message: 'Account verification failed: User verified status not updated.',
          // reason: 'User verified status not updated.'
        });
      }

      const user = userUpdateResult.rows[0]
      delete user.providers.email.password

      // COMMIT Transaction and update all records simultaneously
      await client.query('COMMIT');

      return user

    } catch (error) {
      console.error('Database query error:', error);
      this.logger.log('warn', `Error: auth-query-service updateEmailConfirmationUsedAndVerifyUser: ${error}`);
      await client.query('ROLLBACK');
      throw new Error('Error: auth-query-service updateEmailConfirmationUsedAndVerifyUser');
    } finally {
      // IMPORTANT: Release the client back to the pool from transaction
      client.release();
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


  async insertPasswordResetEmailConfirmations(
    userId: string,
    email: string,
    confirmationCode: string,
    expiresAt: Date
  ): Promise<any> {
    const queryText = `
      INSERT INTO "password_reset_email_confirmations" (user_id, email, code, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `;

    const values = [
      userId,
      email,
      confirmationCode,
      expiresAt
    ];

    try {
      const result = await this.pgPool.query(queryText, values);      
      return result.rows[0]
    } catch (error) {
      this.logger.log('warn', `Error: auth-query-service insertPasswordResetEmailConfirmations: ${error}`);
      throw new Error('Error: auth-query-service insertPasswordResetEmailConfirmations');
    }
  }

  async findPasswordResetConfirmation(dto: ResetPasswordDto) {
    try {
      const result = await this.pgPool.query('SELECT * FROM password_reset_email_confirmations WHERE code = $1 AND id = $2 AND email = $3;', [dto.code, dto.id, dto.email]);
      return result.rows[0]
    } catch (error) {
      console.error('Database query error:', error);
      this.logger.log('warn', `Error: auth-query-service findPasswordResetConfirmation: ${error}`);
      throw new Error('Error: auth-query-service findPasswordResetConfirmation');
    }
  }

    // must use transaction to perform both update password_reset_email_confirmations and users table, both updates must succeed or none update
  async updatePassword(dto: ResetPasswordDto, user_id: string) {
    const now = new Date();
    const usedAtTimestamp = now.toISOString();

    // Get a client from the pool to manage the transaction
    const client = await this.pgPool.connect();
    try {
      await client.query('BEGIN'); // START THE TRANSACTION
      
      // --- QUERY 1: UPDATE password_reset_email_confirmations (Mark as used) ---
      const confirmationUsedAtUpdateResult = await client.query(
        `UPDATE "password_reset_email_confirmations" 
        SET used_at = $1 
        WHERE id = $2 AND used_at IS NULL RETURNING user_id;`,
        [usedAtTimestamp, dto.id]);        
        
      if (confirmationUsedAtUpdateResult.rowCount === 0) {
        // If no row was updated, the code was invalid, expired, or already used.
        // We must rollback before throwing an error.
        await client.query('ROLLBACK');
        this.logger.log('warn', `Error: auth-query-service updatePassword: Database failed to mark email as confirmed.`);
        throw new ConflictException({
          message: 'Password reset failed: Failed to confirm cornfirmation used at.',
        });
      }

      // --- QUERY 2: UPDATE users (Update new providers email hashed password) ---
      // We use the JSONB operator || (concatenation) to merge a new value deep into the object
      const userUpdateResult = await client.query(
        `UPDATE "users" 
        SET providers = jsonb_set(
          providers,                                       -- The JSONB column to update
          '{email, password}',                             -- The path to the key (['email', 'password'])
          $3::jsonb,                                       -- The new value (password string), cast to jsonb
          true                                             -- The create_missing flag
        ),
        updated_at = $1
        WHERE id = $2
        RETURNING *;`,
        [usedAtTimestamp, user_id, `"${dto.password}"`]
      );

      if (userUpdateResult.rowCount === 0) {
        // Highly unlikely to fail if the user was found earlier, but good for atomicity
        await client.query('ROLLBACK');
        this.logger.log('warn', `Error: auth-query-service updatePassword: Failed to update users table user password.`);
        throw new ConflictException({
          message: 'Password reset failed: Failed to update users password.',
        });
      }

      const user = userUpdateResult.rows[0]
      delete user.providers.email.password

      // COMMIT Transaction and update all records simultaneously
      await client.query('COMMIT');

      return user

    } catch (error) {
      console.error('Database query error:', error);
      this.logger.log('warn', `Error: auth-query-service updatePassword: ${error}`);
      await client.query('ROLLBACK');
      throw new Error('Error: auth-query-service updatePassword');
    } finally {
      // IMPORTANT: Release the client back to the pool from transaction
      client.release();
    }
  }


}
