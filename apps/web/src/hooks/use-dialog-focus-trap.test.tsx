import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDialogFocusTrap } from "./use-dialog-focus-trap";

function TestDialogComponent({
  initialOpen = true,
  onClose,
}: {
  initialOpen?: boolean;
  onClose?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const dialogRef = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose: handleClose,
  });

  return (
    <div>
      <button type="button" data-testid="outside-trigger" onClick={() => setIsOpen(true)}>
        Open Dialog
      </button>

      {isOpen && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Test Modal"
          data-testid="dialog-container"
        >
          <button type="button" data-testid="first-button">
            First
          </button>
          <input type="text" data-testid="middle-input" placeholder="Middle" />
          <button type="button" data-testid="last-button" onClick={handleClose}>
            Last Close
          </button>
        </div>
      )}
    </div>
  );
}

describe("useDialogFocusTrap", () => {
  afterEach(() => {
    cleanup();
    document.body.style.overflow = "";
  });

  it("locks body scroll when open and restores it when closed", () => {
    const { unmount } = render(<TestDialogComponent initialOpen={true} />);
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("calls onClose when Escape key is pressed", () => {
    const onClose = vi.fn();
    render(<TestDialogComponent initialOpen={true} onClose={onClose} />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.body.style.overflow).toBe("");
  });

  it("traps focus between first and last elements on Tab and Shift+Tab", () => {
    render(<TestDialogComponent initialOpen={true} />);

    const first = screen.getByTestId("first-button");
    const last = screen.getByTestId("last-button");

    first.focus();
    expect(document.activeElement).toBe(first);

    // Shift+Tab on first element should wrap to last
    fireEvent.keyDown(screen.getByTestId("dialog-container"), {
      key: "Tab",
      shiftKey: true,
    });
    expect(document.activeElement).toBe(last);

    // Tab on last element should wrap to first
    fireEvent.keyDown(screen.getByTestId("dialog-container"), {
      key: "Tab",
      shiftKey: false,
    });
    expect(document.activeElement).toBe(first);
  });
});
