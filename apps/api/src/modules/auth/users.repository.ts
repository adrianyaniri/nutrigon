import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_CLIENT } from '../../core/database/database.constants.js';
import * as schema from '../../core/database/schema/index.js';
import type { UserEntity, NewUserEntity } from '../../core/database/schema/users.js';
import type { IUsersRepository } from './users.repository.interface.js';

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase().trim()))
      .limit(1);

    return result[0] ?? null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async listByBranch(branchId: string): Promise<UserEntity[]> {
    return this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.branchId, branchId));
  }

  async create(user: NewUserEntity): Promise<UserEntity> {
    const result = await this.db
      .insert(schema.users)
      .values({
        ...user,
        email: user.email.toLowerCase().trim(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0]!;
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.db
      .update(schema.users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, userId));
  }
}

