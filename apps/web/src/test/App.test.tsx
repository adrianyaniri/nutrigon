import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "@/App";

describe("Application Bootstrap", () => {
  it("renders main branding and home page heading without errors", () => {
    render(<App />);

    expect(screen.getByText("Nutrigon")).toBeInTheDocument();
    expect(screen.getByText("Sistema de Gestión para Dietética")).toBeInTheDocument();
  });

  it("renders the 3 branches placeholders", () => {
    render(<App />);

    expect(screen.getByText("Sucursal 1")).toBeInTheDocument();
    expect(screen.getByText("Sucursal 2")).toBeInTheDocument();
    expect(screen.getByText("Sucursal 3")).toBeInTheDocument();
  });
});
