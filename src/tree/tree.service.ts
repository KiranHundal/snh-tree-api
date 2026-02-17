import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import { CreateNodeDto } from './dto/create-node.dto';
import { TreeNode } from './interface/tree-node.interface';

interface NodeRow {
  id: string;
  label: string;
  parent_id: string | null;
}

@Injectable()
export class TreeService {
  constructor(private readonly databaseService: DatabaseService) {}

  findAll(): TreeNode[] {
    // 1. fetch every node from the DB in one go
    const rows = this.databaseService
      .prepare('SELECT id, label, parent_id FROM nodes')
      .all() as NodeRow[];

    const nodeMap = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // 2. create the basic objects for every row
    for (const row of rows) {
      nodeMap.set(row.id, {
        id: row.id,
        label: row.label,
        children: [],
      });
    }

    // 3. link children to parents using the map
    for (const row of rows) {
      const currentNode = nodeMap.get(row.id)!;
      if (row.parent_id === null) {
        roots.push(currentNode);
      } else {
        const parent = nodeMap.get(row.parent_id);
        if (parent) {
          parent.children.push(currentNode);
        }
      }
    }

    return roots;
  }

  create(dto: CreateNodeDto): TreeNode {
    const id = randomUUID();
    const label = dto.label.trim();
    const parentId = dto.parentId ?? null;

    //  if parentId is provided, make sure it actually exists
    if (parentId) {
      const parentExists = this.databaseService
        .prepare('SELECT 1 FROM nodes WHERE id = ?')
        .get(parentId);

      if (!parentExists) {
        throw new NotFoundException(
          `Parent node with id '${parentId}' not found`,
        );
      }
    }

    // insert the new node
    this.databaseService
      .prepare('INSERT INTO nodes (id, label, parent_id) VALUES (?, ?, ?)')
      .run(id, label, parentId);

    return { id, label, parentId, children: [] };
  }
}
