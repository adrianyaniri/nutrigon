import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createInMemoryUsersRepository,
  createHttpUsersRepository,
} from "./users-repository";
import { Role } from "@nutrigon/contracts";

describe("UsersRepository", () => {
  describe("InMemoryUsersRepository", () => {
    let repo: ReturnType<typeof createInMemoryUsersRepository>;

    beforeEach(() => {
      repo = createInMemoryUsersRepository();
      repo.reset();
    });

    it("lists users assigned to a branch", async () => {
      const origoneUsers = await repo.listByBranch("b-origone", "mock-token");
      expect(origoneUsers).toHaveLength(1);
      expect(origoneUsers[0]!.email).toBe("admin.origone@nutrigon.com");
    });

    it("creates a new branch admin user", async () => {
      const newUser = await repo.createUser(
        {
          email: "nuevo.encargado@nutrigon.com",
          fullName: "Nuevo Encargado",
          password: "Password123!",
          role: Role.BRANCH_ADMIN,
          branchId: "b-origone",
        },
        "mock-token"
      );

      expect(newUser.email).toBe("nuevo.encargado@nutrigon.com");
      const list = await repo.listByBranch("b-origone", "mock-token");
      expect(list).toHaveLength(2);
    });

    it("throws error when creating user with duplicate email", async () => {
      await expect(
        repo.createUser(
          {
            email: "admin.origone@nutrigon.com",
            fullName: "Duplicado",
            password: "Password123!",
            role: Role.BRANCH_ADMIN,
            branchId: "b-origone",
          },
          "mock-token"
        )
      ).rejects.toThrow(/ya está registrado/);
    });

    it("resets user password with valid new password", async () => {
      const res = await repo.resetPassword("u-branch-admin-origone", "NewClave123!", "mock-token");
      expect(res.success).toBe(true);
    });

    it("changes current user password", async () => {
      const res = await repo.changePassword(
        { currentPassword: "OldPassword123!", newPassword: "NewPassword123!" },
        "mock-token"
      );
      expect(res.success).toBe(true);
    });
  });

  describe("HttpUsersRepository", () => {
    it("calls HTTP endpoints with bearer token", async () => {
      const fakeFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ id: "u-1", email: "test@nutrigon.com" }],
      });
      globalThis.fetch = fakeFetch;

      const httpRepo = createHttpUsersRepository("http://api.nutrigon.test");
      const result = await httpRepo.listByBranch("b-origone", "jwt-token-123");

      expect(fakeFetch).toHaveBeenCalledWith(
        "http://api.nutrigon.test/api/v1/users?branchId=b-origone",
        expect.objectContaining({
          headers: { Authorization: "Bearer jwt-token-123" },
        })
      );
      expect(result).toHaveLength(1);
    });
  });
});
