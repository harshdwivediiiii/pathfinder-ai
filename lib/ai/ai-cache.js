import { db } from '@/lib/db/prisma';
import crypto from 'crypto';

export async function getCachedOrFetch(promptKey, feature, fetchFn, ttlHours = 24) {
  if (ttlHours <= 0) {
    return await fetchFn();
  }

  const hash = crypto.createHash('sha256').update(promptKey).digest('hex');
  const now = new Date();

  try {
    const cached = await db.aiResponseCache.findUnique({
      where: { promptHash: hash },
    });

    if (cached && cached.expiresAt > now) {
      console.info(`[Cache] Hit for ${feature} (${hash.substring(0, 8)})`);
      return JSON.parse(cached.response);
    }
  } catch (error) {
    console.warn(`[Cache] Read error for ${feature}:`, error.message);
  }

  console.debug(`[Cache] Miss for ${feature} (${hash.substring(0, 8)})`);
  console.info(`[Cache] Miss for ${feature} (${hash.substring(0, 8)})`);
  const result = await fetchFn();

  if (result == null) {
    console.warn(`[Cache] Skipping cache write: fetchFn returned ${result} for ${feature}`);
    return result;
  }

  try {
    await db.aiResponseCache.upsert({
      where: { promptHash: hash },
      create: {
        promptHash: hash,
        response: JSON.stringify(result),
        feature: feature,
        expiresAt: new Date(now.getTime() + ttlHours * 3600_000),
      },
      update: {
        response: JSON.stringify(result),
        expiresAt: new Date(now.getTime() + ttlHours * 3600_000),
      },
    });
  } catch (error) {
    console.warn(`[Cache] Write error for ${feature}:`, error.message);
  }

  return result;
}
