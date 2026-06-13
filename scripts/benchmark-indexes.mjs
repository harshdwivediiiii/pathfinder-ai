/**
 * Index benchmark script — run after applying add_composite_indexes migration.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." node scripts/benchmark-indexes.mjs
 *
 * Verifies that hot-path Prisma queries execute without error and prints
 * EXPLAIN plans for the underlying SQL patterns.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function explain(sql) {
  const rows = await db.$queryRawUnsafe(`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ${sql}`);
  return rows.map((r) => r["QUERY PLAN"]).join("\n");
}

async function main() {
  const userId = "bench-user-1";
  const conversationId = "bench-conv-1";

  await db.$executeRawUnsafe(`
    INSERT INTO "User" (id, "clerkUserId", email, "updatedAt")
    VALUES ('${userId}', 'clerk-bench-1', 'bench@test.com', NOW())
    ON CONFLICT (id) DO NOTHING
  `);
  await db.$executeRawUnsafe(`
    INSERT INTO "Conversation" (id, "userId", title, "updatedAt")
    VALUES ('${conversationId}', '${userId}', 'Benchmark Chat', NOW())
    ON CONFLICT (id) DO NOTHING
  `);
  await db.$executeRawUnsafe(`
    INSERT INTO "Message" (id, "conversationId", role, content, "createdAt")
    VALUES
      ('bench-msg-1', '${conversationId}', 'user', 'hello', NOW() - INTERVAL '2 minutes'),
      ('bench-msg-2', '${conversationId}', 'assistant', 'hi there', NOW() - INTERVAL '1 minute')
    ON CONFLICT (id) DO NOTHING
  `);

  console.log("--- Prisma: conversations by user, ordered by updatedAt desc ---");
  const conversations = await db.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  console.log(`Found ${conversations.length} conversation(s)`);

  console.log("\n--- Prisma: messages by conversation, ordered by createdAt asc ---");
  const messages = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
  console.log(`Found ${messages.length} message(s)`);

  console.log("\n--- EXPLAIN ANALYZE: Message composite index ---");
  console.log(
    await explain(
      `SELECT * FROM "Message" WHERE "conversationId" = '${conversationId}' ORDER BY "createdAt" ASC`
    )
  );

  console.log("\n--- EXPLAIN ANALYZE: Conversation composite index ---");
  console.log(
    await explain(
      `SELECT * FROM "Conversation" WHERE "userId" = '${userId}' ORDER BY "updatedAt" DESC`
    )
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
