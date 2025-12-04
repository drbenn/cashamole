import { Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PG_CONNECTION } from './database.constants';

const databaseProvider = {
  provide: PG_CONNECTION,
  // Use a factory to create the Pool instance
  // The useFactory function will be called once when the provider is first resolved.
  useFactory: async (configService: ConfigService) => {
    // Note: The Pool is a connection pool, which is what you want
    // for a singleton database resource that many services share.
    const pool = new Pool({
      user: configService.get<string>('POSTGRES_USER') ?? 'missing_pg_user_env_var',
      host: configService.get<string>('POSTGRES_HOST') ?? 'missing_pg_host_env_var',
      database: configService.get<string>('POSTGRES_DB_NAME') ?? 'missing_pg_db_name_env_var',
      password: configService.get<string>('POSTGRES_PASSWORD') ?? 'missing_pg_password_env_var',
      port: configService.get<number>('POSTGRES_PORT') ?? 5432,
      // You can add other pool options here, like max connections
      // max: 20, 
    });

    // Optional: Log a message when the connection is established
    // and test the connection.
    try {
      await pool.query('SELECT 1');
      console.log('PostgreSQL Pool Connection established successfully.');
    } catch (e) {
      console.error('Failed to establish PostgreSQL Pool Connection:', e);
      throw e; // Re-throw to prevent the application from starting with a bad connection
    }

    return pool;
  },
  // Inject ConfigService to get environment variables (or other configuration)
  inject: [ConfigService], 
};

@Module({
  // The 'exports' array makes the provider available for injection
  // in other modules that import DatabaseModule.
  providers: [databaseProvider],
  exports: [PG_CONNECTION],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject(PG_CONNECTION) private pgPool: Pool) {} // Inject pool here

  // Called when the application shuts down
  async onModuleDestroy() {
    if (this.pgPool) {
      console.log('Closing PostgreSQL Pool Connection...');
      // This closes all open connections in the pool
      await this.pgPool.end(); 
    }
  }
  
}
