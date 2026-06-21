import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(() => Promise.resolve({ user: { id: 'test-user' } })),
}));
