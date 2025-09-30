import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from './database-connection';
import * as schema from './schemas/index';

@Injectable()
export class DatabaseService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  get database(): NodePgDatabase<typeof schema> {
    return this.db;
  }

  // Convenience getter for schema access
  get schema() {
    return schema;
  }
}