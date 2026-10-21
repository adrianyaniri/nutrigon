import { describe, expect, it, vi } from 'vitest';
import { ensureInitialAdmin } from './initial-admin.js';

describe('ensureInitialAdmin', () => {
  it('does not alter credentials when the initial administrator already exists', async () => {
    const repository = {
      findByEmail: vi.fn().mockResolvedValue(true),
      createInitialGeneralAdmin: vi.fn(),
    };

    const result = await ensureInitialAdmin(repository, {
      email: 'admin@example.com',
      passwordHash: 'existing-password-must-not-change',
    });

    expect(result).toBe('existing');
    expect(repository.createInitialGeneralAdmin).not.toHaveBeenCalled();
  });
});
