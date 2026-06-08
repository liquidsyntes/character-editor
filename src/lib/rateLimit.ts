import { prisma } from '@/lib/prisma';

export async function checkRateLimit(ip: string, maxRequests: number = 15, windowMs: number = 60000): Promise<{ success: boolean; remaining: number }> {
  const now = new Date();
  
  // Ленивая очистка
  if (Math.random() < 0.1) {
    await prisma.rateLimit.deleteMany({
      where: { resetAt: { lt: now } }
    }).catch(() => {});
  }

  try {
    const record = await prisma.rateLimit.findUnique({ where: { ip } });
    
    if (!record || record.resetAt < now) {
      await prisma.rateLimit.upsert({
        where: { ip },
        update: { count: 1, resetAt: new Date(now.getTime() + windowMs) },
        create: { ip, count: 1, resetAt: new Date(now.getTime() + windowMs) }
      });
      return { success: true, remaining: maxRequests - 1 };
    }
    
    if (record.count >= maxRequests) {
      return { success: false, remaining: 0 };
    }
    
    await prisma.rateLimit.update({
      where: { ip },
      data: { count: record.count + 1 }
    });
    return { success: true, remaining: maxRequests - record.count - 1 };
  } catch (e) {
    // В случае ошибки БД пропускаем запрос, чтобы не блочить
    console.error('Rate limit error:', e);
    return { success: true, remaining: 1 };
  }
}
