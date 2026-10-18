import { purgeExpiredFiles } from './db';

let isCleanupRunning = false;
let cleanupInterval: NodeJS.Timeout | null = null;

export function startBackgroundCleanupWorker(intervalMs = 5000) {
  if (isCleanupRunning) return;
  isCleanupRunning = true;

  console.log(`[Vanish Daemon] Background TTL cleanup worker started (interval: ${intervalMs}ms)`);

  cleanupInterval = setInterval(() => {
    try {
      const res = purgeExpiredFiles();
      if (res.purgedCount > 0) {
        console.log(`[Vanish Daemon] Cleaned up ${res.purgedCount} expired files: ${res.purgedIds.join(', ')}`);
      }
    } catch (e) {
      console.error('[Vanish Daemon] Error during TTL sweep:', e);
    }
  }, intervalMs);

  // Unref so it doesn't block graceful shutdown
  if (cleanupInterval && typeof cleanupInterval.unref === 'function') {
    cleanupInterval.unref();
  }
}

// Automatically start on module import
startBackgroundCleanupWorker();
