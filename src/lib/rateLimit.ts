interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const limits = new Map<string, RateLimitRecord>();

export function checkRateLimit(ip: string, maxRequests: number = 15, windowMs: number = 60000): { success: boolean; remaining: number } {
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
