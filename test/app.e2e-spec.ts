/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import Database from 'better-sqlite3';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';

describe('Tree API (e2e)', () => {
  let app: INestApplication;
  let db: Database.Database;

  beforeAll(async () => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    db.exec(`
      CREATE TABLE nodes (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        parent_id TEXT,
        FOREIGN KEY (parent_id) REFERENCES nodes(id)
      )
    `);

    const mockDbService = {
      prepare: (sql: string) => db.prepare(sql),
      exec: (sql: string) => db.exec(sql),
      onModuleInit: () => {},
      onModuleDestroy: () => {},
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDbService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    db.close();
  });

  afterEach(() => {
    db.exec('DELETE FROM nodes');
  });

  describe('GET /api/tree', () => {
    it('returns empty array when db is empty', () => {
      return request(app.getHttpServer())
        .get('/api/tree')
        .expect(200)
        .expect([]);
    });

    it('returns nested tree structure', async () => {
      // create root
      const { body: root } = await request(app.getHttpServer())
        .post('/api/tree')
        .send({ label: 'Root' })
        .expect(201);

      // create child
      await request(app.getHttpServer())
        .post('/api/tree')
        .send({ label: 'Child', parentId: root.id })
        .expect(201);

      const { body: trees } = await request(app.getHttpServer())
        .get('/api/tree')
        .expect(200);

      expect(trees).toHaveLength(1);
      expect(trees[0].label).toBe('Root');
      expect(trees[0].children).toHaveLength(1);
      expect(trees[0].children[0].label).toBe('Child');
    });
  });

  describe('POST /api/tree', () => {
    it('creates a root node', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/tree')
        .send({ label: 'Root' })
        .expect(201);

      expect(body.id).toBeDefined();
      expect(body.label).toBe('Root');
      expect(body.children).toEqual([]);
    });

    it('creates a child node under existing parent', async () => {
      const { body: root } = await request(app.getHttpServer())
        .post('/api/tree')
        .send({ label: 'Root' });

      const { body: child } = await request(app.getHttpServer())
        .post('/api/tree')
        .send({ label: 'Child', parentId: root.id })
        .expect(201);

      expect(child.label).toBe('Child');
      expect(child.id).not.toBe(root.id);
    });

    it('returns 404 for nonexistent parentId', () => {
      return request(app.getHttpServer())
        .post('/api/tree')
        .send({
          label: 'Orphan',
          parentId: '00000000-0000-4000-8000-000000000000',
        })
        .expect(404);
    });

    it('returns 400 when label is missing', () => {
      return request(app.getHttpServer())
        .post('/api/tree')
        .send({})
        .expect(400);
    });

    it('returns 400 when label is empty string', () => {
      return request(app.getHttpServer())
        .post('/api/tree')
        .send({ label: '' })
        .expect(400);
    });

    it('rejects unknown fields', () => {
      return request(app.getHttpServer())
        .post('/api/tree')
        .send({ label: 'Root', foo: 'bar' })
        .expect(400);
    });
  });
});
