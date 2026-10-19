import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CatalogBranch } from "../types";
import { BranchPickerModal } from "./branch-picker-modal";

const branches: CatalogBranch[] = [
  { id: "b1", name: "Centro", slug: "centro", address: "San Martín 450", phone: "123", whatsappNumber: "5493514210001" },
  { id: "b2", name: "Norte", slug: "norte", address: "Av. Libertad 1200", phone: "456", whatsappNumber: "5493514210002" },
];

describe("BranchPickerModal", () => {
  afterEach(() => {
    cleanup();
  });

  it("does not render when isOpen is false", () => {
    render(
      <BranchPickerModal
        isOpen={false}
        onClose={vi.fn()}
        branches={branches}
        currentBranchSlug="centro"
        onSelectBranch={vi.fn()}
        cartItemCount={0}
      />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders modal with branches and 44px touch-target close button", () => {
    const onClose = vi.fn();
    render(
      <BranchPickerModal
        isOpen={true}
        onClose={onClose}
        branches={branches}
        currentBranchSlug="centro"
        onSelectBranch={vi.fn()}
        cartItemCount={0}
      />
    );

    expect(screen.getByRole("dialog", { name: "Seleccionar Sucursal" })).toBeInTheDocument();
    expect(screen.getByText("Sucursal Centro")).toBeInTheDocument();
    expect(screen.getByText("Sucursal Norte")).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: "Cerrar ventana" });
    expect(closeBtn).toBeInTheDocument();
    expect(closeBtn).toHaveClass("min-h-[44px]");
    expect(closeBtn).toHaveClass("min-w-[44px]");

    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows warning when switching branches with items in cart", () => {
    render(
      <BranchPickerModal
        isOpen={true}
        onClose={vi.fn()}
        branches={branches}
        currentBranchSlug="centro"
        onSelectBranch={vi.fn()}
        cartItemCount={3}
      />
    );

    expect(screen.getByText(/Tenés 3 productos en tu pedido/i)).toBeInTheDocument();
  });

  it("calls onSelectBranch and onClose when clicking a branch", () => {
    const onSelectBranch = vi.fn();
    const onClose = vi.fn();
    render(
      <BranchPickerModal
        isOpen={true}
        onClose={onClose}
        branches={branches}
        currentBranchSlug="centro"
        onSelectBranch={onSelectBranch}
        cartItemCount={0}
      />
    );

    const norteOption = screen.getByRole("radio", { name: /Sucursal Norte/i });
    fireEvent.click(norteOption);
    expect(onSelectBranch).toHaveBeenCalledWith("norte");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape key press via useDialogFocusTrap", () => {
    const onClose = vi.fn();
    render(
      <BranchPickerModal
        isOpen={true}
        onClose={onClose}
        branches={branches}
        currentBranchSlug="centro"
        onSelectBranch={vi.fn()}
        cartItemCount={0}
      />
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
