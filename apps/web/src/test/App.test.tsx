import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "@/App";

describe("Application Bootstrap", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders main branding, catalog landing, and admin access button without errors", async () => {
    render(<App />);

    expect(screen.getAllByText("Nutrigon").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Dietética & Cerealera/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Escaneá el código QR en tu sucursal/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Acceso Gestión/i })).toBeInTheDocument();

    await screen.findByRole("heading", { name: /Sucursal (Centro|Origone)/i });
  });

  it("renders the business branches and QR actions", async () => {
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: /Sucursal (Centro|Origone)/i })
    ).toBeInTheDocument();
  });
});
