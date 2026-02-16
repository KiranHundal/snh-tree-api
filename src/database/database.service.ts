import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import Database from 'better-sqlite3';
import type { Statement, Database as SqliteDatabase } from 'better-sqlite3';
import { join } from 'path';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private db: SqliteDatabase;

  onModuleInit() {
    const dbPath = process.env.DB_PATH || join(process.cwd(), 'tree.db');

    try {
      this.db = new Database(dbPath);

      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');

      this.ensureSchema();
      this.logger.log(`Persistence layer ready: ${dbPath}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Database initialization failed: ${errorMessage}`);
      throw error;
    }
  }

  private ensureSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS nodes (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        parent_id TEXT,
        FOREIGN KEY (parent_id) REFERENCES nodes(id)
      );
    `);
  }

  prepare(sql: string): Statement {
    return this.db.prepare(sql);
  }

  exec(sql: string): SqliteDatabase {
    return this.db.exec(sql);
  }

  onModuleDestroy() {
    if (this.db) {
      this.db.close();
      this.logger.log('Database connection closed');
    }
  }
}
