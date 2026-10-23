import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminPwaInstallModal } from "./admin-pwa-install-modal";

describe("AdminPwaInstallModal", () => {
  it("does not render anything when isOpen is false", () => {
    const { container } = render(
      <AdminPwaInstallModal isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders PWA installation modal with title, instructions and actions when isOpen is true", async () => {
    render(<AdminPwaInstallModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(/Instalar PWA Administrativa/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Copiar enlace/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Imprimir instructivo/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText("https://admin.nutrigon.ar")
    ).toBeInTheDocument();
    expect(screen.getByText(/Android/i)).toBeInTheDocument();
    expect(screen.getByText(/iPhone/i)).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(<AdminPwaInstallModal isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByLabelText(/Cerrar ventana de instalación/i);
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

    render(<AdminPwaInstallModal isOpen={true} onClose={vi.fn()} />);

    const copyBtn = screen.getByRole("button", { name: /Copiar enlace/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith("https://admin.nutrigon.ar");
    });
  });

  it("calls onClose when Escape key is pressed", () => {
    const handleClose = vi.fn();
    render(<AdminPwaInstallModal isOpen={true} onClose={handleClose} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when clicking on the backdrop overlay", () => {
    const handleClose = vi.fn();
    render(<AdminPwaInstallModal isOpen={true} onClose={handleClose} />);

    const dialogBackdrop = screen.getByRole("dialog");
    fireEvent.click(dialogBackdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("prints QR poster using standard DOM manipulation without document.write", async () => {
    const mockPrint = vi.fn();
    const mockClose = vi.fn();
    const mockFocus = vi.fn();

    const mockPrintWindow = {
      document: {
        title: "",
        head: document.createElement("head"),
        body: document.createElement("body"),
      },
      focus: mockFocus,
      print: mockPrint,
      close: mockClose,
    };

    const openSpy = vi
      .spyOn(window, "open")
      .mockReturnValue(mockPrintWindow as unknown as Window);

    render(<AdminPwaInstallModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      const printBtn = screen.getByRole("button", { name: /Imprimir instructivo/i });
      expect(printBtn).not.toBeDisabled();
    });

    const printBtn = screen.getByRole("button", { name: /Imprimir instructivo/i });
    fireEvent.click(printBtn);

    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();
  });
});
