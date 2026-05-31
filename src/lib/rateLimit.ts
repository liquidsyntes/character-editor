interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const limits = new Map<string, RateLimitRecord>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 минут

// Ленивая очистка устаревших IP для предотвращения утечки памяти
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  for (const [key, record] of limits.entries()) {
    if (record.resetAt < now) {
      limits.delete(key);
    }
  }
  lastCleanup = now;
}

export function checkRateLimit(ip: string, maxRequests: number = 15, windowMs: number = 60000): { success: boolean; remaining: number } {
  cleanup(); // Вызываем очистку при каждом запросе (реально сработает раз в 5 минут)

  const now = Date.now();
  const record = limits.get(ip);
  
  if (!record || record.resetAt < now) {
    limits.set(ip, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: maxRequests - 1 };
  }
  
  if (record.count >= maxRequests) {
    return { success: false, remaining: 0 };
  }
  
  record.count++;
  return { success: true, remaining: maxRequests - record.count };
}
