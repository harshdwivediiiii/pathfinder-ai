# Index Benchmark Results — `add_composite_indexes`

Migration: `20260606144945_add_composite_indexes`

## Migration SQL (verified)

```sql
DROP INDEX "IndustryInsight_industry_idx";
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");
CREATE INDEX "Conversation_userId_updatedAt_idx" ON "Conversation"("userId", "updatedAt");
```

## Post-migration index state

| Table | Index | Notes |
|---|---|---|
| IndustryInsight | `IndustryInsight_industry_key` (unique) | Redundant `IndustryInsight_industry_idx` removed |
| Message | `Message_conversationId_idx` | Single-column — kept |
| Message | `Message_conversationId_createdAt_idx` | **New** composite |
| Conversation | `Conversation_userId_idx` | Single-column — kept |
| Conversation | `Conversation_userId_updatedAt_idx` | **New** composite |

## EXPLAIN ANALYZE (after migration)

**Message** — filter by `conversationId`, order by `createdAt ASC`:

```
Bitmap Index Scan on "Message_conversationId_createdAt_idx"
  Index Cond: ("conversationId" = 'bench-conv-1'::text)
Execution Time: 0.085 ms
```

**Conversation** — filter by `userId`, order by `updatedAt DESC`:

```
Bitmap Index Scan on "Conversation_userId_updatedAt_idx"
  Index Cond: ("userId" = 'bench-user-1'::text)
Execution Time: 0.077 ms
```

## Prisma query smoke test

Re-run locally:

```bash
DATABASE_URL="your_db_url" node scripts/benchmark-indexes.mjs
```

Confirmed Prisma `findMany` patterns used by conversation routes execute successfully:

- `conversation.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } })`
- `message.findMany({ where: { conversationId }, orderBy: { createdAt: "asc" } })`
