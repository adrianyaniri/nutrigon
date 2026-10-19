import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CategoryChips } from "./category-chips";
import type { CategoryOption } from "@/features/catalog/types";

const mockOptions: readonly CategoryOption[] = [
  { value: null, label: "Todos", count: 24 },
  { value: "frutos-secos", label: "Frutos Secos", count: 8 },
  { value: "harinas", label: "Harinas", count: 6 },
  { value: "sin-tacc", label: "Sin TACC", count: 5 },
];

describe("CategoryChips", () => {
  it("renders all category options with counts", () => {
    render(
      <CategoryChips
        options={mockOptions}
        value={null}
        onChange={vi.fn()}
        onOpenDrawer={vi.fn()}
      />
    );

    expect(screen.getByRole("navigation", { name: "Categorías" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Todos/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Frutos Secos/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Harinas/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sin TACC/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir todas las categorías" })).toBeInTheDocument();
  });

  it("calls onChange when clicking a category chip", () => {
    const onChange = vi.fn();
    render(
      <CategoryChips
        options={mockOptions}
        value={null}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Frutos Secos/ }));
    expect(onChange).toHaveBeenCalledWith("frutos-secos");
  });

  it("marks active category chip as aria-pressed true", () => {
    render(
      <CategoryChips
        options={mockOptions}
        value="harinas"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /Harinas/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Frutos Secos/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onOpenDrawer when clicking the drawer trigger button", () => {
    const onOpenDrawer = vi.fn();
    render(
      <CategoryChips
        options={mockOptions}
        value={null}
        onChange={vi.fn()}
        onOpenDrawer={onOpenDrawer}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Abrir todas las categorías" }));
    expect(onOpenDrawer).toHaveBeenCalledOnce();
  });
});
