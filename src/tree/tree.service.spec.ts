import { Test, TestingModule } from '@nestjs/testing';
import Database from 'better-sqlite3';
import { TreeService } from './tree.service';
import { DatabaseService } from '../database/database.service';
import { NotFoundException } from '@nestjs/common';

describe('TreeService', () => {
  let service: TreeService;
  let db: Database.Database;

  beforeEach(async () => {
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
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreeService,
        { provide: DatabaseService, useValue: mockDbService },
      ],
    }).compile();

    service = module.get<TreeService>(TreeService);
  });

  afterEach(() => {
    db.close();
  });

  describe('findAll', () => {
    it('returns empty array when no nodes exist', () => {
      expect(service.findAll()).toEqual([]);
    });

    it('returns a single root node', () => {
      const node = service.create({ label: 'Root' });
      const trees = service.findAll();

      expect(trees).toHaveLength(1);
      expect(trees[0].id).toBe(node.id);
      expect(trees[0].label).toBe('Root');
      expect(trees[0].children).toEqual([]);
    });

    it('nests children under their parent', () => {
      const root = service.create({ label: 'Root' });
      const child = service.create({ label: 'Child', parentId: root.id });
      service.create({ label: 'Grandchild', parentId: child.id });

      const trees = service.findAll();

      expect(trees).toHaveLength(1);
      expect(trees[0].children).toHaveLength(1);
      expect(trees[0].children[0].label).toBe('Child');
      expect(trees[0].children[0].children[0].label).toBe('Grandchild');
    });

    it('handles multiple root trees', () => {
      service.create({ label: 'Tree A' });
      service.create({ label: 'Tree B' });

      const trees = service.findAll();
      expect(trees).toHaveLength(2);
    });
  });

  describe('create', () => {
    it('creates a root node when no parentId given', () => {
      const node = service.create({ label: 'Root' });

      expect(node.id).toBeDefined();
      expect(node.label).toBe('Root');
      expect(node.children).toEqual([]);
    });

    it('creates a child under an existing parent', () => {
      const root = service.create({ label: 'Root' });
      const child = service.create({ label: 'Child', parentId: root.id });

      expect(child.id).not.toBe(root.id);
      expect(child.label).toBe('Child');
    });

    it('throws NotFoundException for a nonexistent parentId', () => {
      expect(() =>
        service.create({
          label: 'Orphan',
          parentId: '00000000-0000-4000-8000-000000000000',
        }),
      ).toThrow(NotFoundException);
    });

    it('trims whitespace from labels', () => {
      const node = service.create({ label: '  Padded  ' });
      expect(node.label).toBe('Padded');
    });
  });
});
