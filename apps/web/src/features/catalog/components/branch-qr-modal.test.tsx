import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BranchQrModal } from "./branch-qr-modal";

describe("BranchQrModal", () => {
  const mockBranch = {
    name: "Origone",
    slug: "origone",
    address: "Tte. Manuel Origone 196",
  };

  it("does not render anything when isOpen is false", () => {
    const { container } = render(
      <BranchQrModal isOpen={false} onClose={vi.fn()} branch={mockBranch} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders branch QR modal with title and actions when isOpen is true", async () => {
    render(<BranchQrModal isOpen={true} onClose={vi.fn()} branch={mockBranch} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/QR Catálogo Sucursal Origone/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Copiar enlace/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Imprimir cartel/i })).toBeInTheDocument();
    expect(
      screen.getByText("https://www.nutrigon.ar/catalogo/origone")
    ).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(<BranchQrModal isOpen={true} onClose={handleClose} branch={mockBranch} />);

    const closeBtn = screen.getByLabelText(/Cerrar ventana de código QR/i);
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("copies link to clipboard when clicking Copiar enlace", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<BranchQrModal isOpen={true} onClose={vi.fn()} branch={mockBranch} />);

    const copyBtn = screen.getByRole("button", { name: /Copiar enlace/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(
        "https://www.nutrigon.ar/catalogo/origone"
      );
    });
  });

  it("calls onClose when Escape key is pressed", () => {
    const handleClose = vi.fn();
    render(<BranchQrModal isOpen={true} onClose={handleClose} branch={mockBranch} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when clicking on the backdrop overlay", () => {
    const handleClose = vi.fn();
    render(<BranchQrModal isOpen={true} onClose={handleClose} branch={mockBranch} />);

    const dialogBackdrop = screen.getByRole("dialog");
    fireEvent.click(dialogBackdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("prints QR poster using standard DOM manipulation without document.write", async () => {
    const mockPrint = vi.fn();
    const mockClose = vi.fn();
    const mockFocus = vi.fn();
    const mockWrite = vi.fn();

    const mockPrintWindow = {
      document: {
        title: "",
        head: document.createElement("head"),
        body: document.createElement("body"),
        createElement: (tag: string) => document.createElement(tag),
        write: mockWrite,
      },
      focus: mockFocus,
      print: mockPrint,
      close: mockClose,
    };

    const openSpy = vi
      .spyOn(window, "open")
      .mockReturnValue(mockPrintWindow as unknown as Window);

    render(<BranchQrModal isOpen={true} onClose={vi.fn()} branch={mockBranch} />);

    const printBtn = screen.getByRole("button", { name: /Imprimir cartel/i });
    await waitFor(() => {
      expect(printBtn).toBeEnabled();
    });

    fireEvent.click(printBtn);

    expect(openSpy).toHaveBeenCalledWith("", "_blank");
    expect(mockWrite).not.toHaveBeenCalled();
    expect(mockPrintWindow.document.title).toContain("Origone");
    expect(mockPrintWindow.document.body.innerHTML).toContain("Nutrigon");
    expect(mockPrintWindow.document.body.innerHTML).toContain("Sucursal Origone");
    expect(mockFocus).toHaveBeenCalled();

    openSpy.mockRestore();
  });
});
