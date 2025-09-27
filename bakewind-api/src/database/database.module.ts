import { Global, Module } from '@nestjs/common';
import { DATABASE_CONNECTION } from './database-connection';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schemas/index';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useFactory: (configService: ConfigService) => {
        const pool = new Pool({
          connectionString: configService.getOrThrow<string>('DATABASE_URL'),
          ssl: false, // Disable SSL for local development
        });
        const db = drizzle(pool, { schema }) as NodePgDatabase<typeof schema>;
        return db;
      },
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}

// Export the token for external use
export { DATABASE_CONNECTION };
