import { describe, expect, it } from "vitest";
import { createInMemoryBranchesRepository } from "./branches-repository";

describe("BranchesRepository (In-Memory)", () => {
  it("lists all initial branches", async () => {
    const repo = createInMemoryBranchesRepository();
    const branches = await repo.getBranches();

    expect(branches.length).toBe(3);
    expect(branches.map((b) => b.slug)).toContain("origone");
    expect(branches.map((b) => b.slug)).toContain("pedro-diaz");
    expect(branches.map((b) => b.slug)).toContain("w-morris");
  });

  it("creates a new branch and prevents duplicate slugs", async () => {
    const repo = createInMemoryBranchesRepository();

    const created = await repo.createBranch(
      {
        name: "Castelar",
        slug: "castelar",
        address: "Arias 2400, Castelar",
        phone: "11-4450-9999",
        whatsappNumber: "5491144509999",
      },
      "token"
    );

    expect(created.id).toBeDefined();
    expect(created.name).toBe("Castelar");
    expect(created.slug).toBe("castelar");
    expect(created.isActive).toBe(true);

    const all = await repo.getBranches();
    expect(all.length).toBe(4);

    await expect(
      repo.createBranch(
        {
          name: "Castelar Duplicate",
          slug: "castelar",
        },
        "token"
      )
    ).rejects.toThrow(/Ya existe una sucursal con el slug "castelar"/i);
  });

  it("updates branch details and toggle active status", async () => {
    const repo = createInMemoryBranchesRepository();

    const updated = await repo.updateBranch(
      "b-origone",
      {
        whatsappNumber: "5491100001111",
        address: "Nueva Dirección 999",
      },
      "token"
    );

    expect(updated.whatsappNumber).toBe("5491100001111");
    expect(updated.address).toBe("Nueva Dirección 999");

    const deactivated = await repo.deleteBranch("b-origone", "token");
    expect(deactivated.isActive).toBe(false);

    const activeOnly = await repo.getBranches("token", false);
    expect(activeOnly.map((b) => b.id)).not.toContain("b-origone");
  });
});
