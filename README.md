# snh-tree-api

HTTP API for managing hierarchical tree structures. Built with NestJS, TypeScript, and SQLite.

## Prerequisites

- Node.js >= 18
- npm

## Setup

```bash
npm install
```

## Running

```bash
npm run start:dev
```

Runs on `http://localhost:3000` by default. Override with the `PORT` env var.

For production: `npm run build && npm start`

Data persists in `./tree.db`. Override with `DB_PATH`.

## API

### GET /api/tree

Returns all trees as nested JSON. Empty array if no nodes exist.

```bash
curl http://localhost:3000/api/tree
```

```json
[
  {
    "id": "a1b2c3d4-...",
    "label": "Root",
    "children": [
      {
        "id": "e5f6g7h8-...",
        "label": "Child",
        "children": []
      }
    ]
  }
]
```

### POST /api/tree

Creates a node. Send `parentId` to attach it under an existing node, or omit it to create a new root.

```bash
# root node
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "Engineering"}'

# child node
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "Backend", "parentId": "<id-from-above>"}'
```

**Responses:**
- `201` — node created successfully
- `400` — validation error (missing label, empty label, unknown fields)
- `404` — `parentId` references a node that doesn't exist

Validation is handled by NestJS `ValidationPipe` with `whitelist` and `forbidNonWhitelisted` enabled, so unknown fields in the request body are rejected.

## Testing

```bash
npm test            # unit tests
npm run test:e2e    # integration tests
```

Both use in-memory SQLite so there's no filesystem state to clean up between runs.

Unit tests cover the tree assembly logic and edge cases (empty db, deep nesting, invalid parent). E2e tests hit the actual HTTP endpoints through the full NestJS stack including validation.

## Design decisions and trade-offs

**SQLite over Postgres/MySQL** — There's one table. Pulling in a full database server or an ORM like TypeORM would add setup complexity without much benefit. SQLite with `better-sqlite3` keeps it simple: no external process, no connection pooling, and the synchronous API avoids unnecessary async overhead for an embedded db.

**In-memory tree assembly** — `findAll` does a single `SELECT` and builds the tree with a Map in O(n). The alternative would be recursive CTEs or multiple queries per level, which are more complex and slower for this use case. The trade-off is that the full node set has to fit in memory, which is fine for reasonable dataset sizes but wouldn't scale to millions of nodes without pagination.

**UUIDs instead of auto-increment integers** — The spec example shows integer IDs. I went with UUIDs to avoid collision concerns and because they don't expose insertion order. The trade-off is slightly larger IDs in the response payload.

**Multiple roots allowed** — The API allows creating multiple root nodes (nodes with no parent). This felt more flexible than restricting to a single root, and the spec shows the response as an array which implies multiple trees are expected.