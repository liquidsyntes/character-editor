import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as actions from './actions';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      updateMany: vi.fn(),
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    character: {
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  }
}));

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'test-user-id' } } as any);
  });

  describe('updateProject', () => {
    it('should update project if authorized', async () => {
      vi.mocked(prisma.project.updateMany).mockResolvedValue({ count: 1 } as any);
      
      await actions.updateProject('project-1', { name: 'New Name' });
      
      expect(prisma.project.updateMany).toHaveBeenCalledWith({
        where: { id: 'project-1', userId: 'test-user-id' },
        data: { name: 'New Name' }
      });
    });

    it('should throw Unauthorized if project not found or not owned', async () => {
      vi.mocked(prisma.project.updateMany).mockResolvedValue({ count: 0 } as any);
      
      await expect(actions.updateProject('project-1', { name: 'New' })).rejects.toThrow('Unauthorized');
    });
  });

  describe('updateCharacter', () => {
    it('should update character data', async () => {
      vi.mocked(prisma.character.updateMany).mockResolvedValue({ count: 1 } as any);
      
      await actions.updateCharacter('char-1', { firstName: 'John', lastName: 'Doe', age: '30' });
      
      expect(prisma.character.updateMany).toHaveBeenCalledWith({
        where: { id: 'char-1', userId: 'test-user-id' },
        data: expect.objectContaining({
          name: 'John Doe',
          isDraft: false,
          data: expect.any(String)
        })
      });
    });
  });
});
