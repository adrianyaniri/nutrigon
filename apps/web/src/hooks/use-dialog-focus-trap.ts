import { useEffect, useRef } from "react";

export interface UseDialogFocusTrapOptions {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Optional container ref. If not provided, an internal ref is created and returned.
   */
  containerRef?: React.RefObject<HTMLElement | null>;
  /**
   * If true, locks document.body scroll while the dialog is open.
   * Defaults to true.
   */
  lockScroll?: boolean;
  /**
   * Optional custom selector for the first element to focus on open.
   */
  initialFocusSelector?: string;
  /**
   * If false, Escape key will not call onClose.
   * Defaults to true.
   */
  closeOnEscape?: boolean;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog hook that provides:
 * 1. Focus trap (Tab / Shift+Tab cycling inside the dialog container).
 * 2. Escape key dismissal.
 * 3. Initial focus placement when opening.
 * 4. Focus restoration to the previously active element upon closing.
 * 5. Scroll lock on document.body during open state.
 */
export function useDialogFocusTrap<T extends HTMLElement = HTMLDivElement>({
  isOpen,
  onClose,
  containerRef,
  lockScroll = true,
  initialFocusSelector,
  closeOnEscape = true,
}: UseDialogFocusTrapOptions) {
  const fallbackRef = useRef<T>(null);
  const ref = (containerRef ?? fallbackRef) as React.RefObject<T | null>;
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  // Keep the latest onClose in a ref so inline callbacks don't re-run the effect
  // (which would steal focus back to the first focusable element on every render).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key === "Tab" && ref.current) {
        const focusableElements = ref.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusableElements[0]!;
        const last = focusableElements[focusableElements.length - 1]!;

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus({ preventScroll: true });
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus({ preventScroll: true });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    let originalOverflow = "";
    if (lockScroll) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    // Set initial focus
    const frameId = requestAnimationFrame(() => {
      if (!ref.current) return;
      if (initialFocusSelector) {
        const target = ref.current.querySelector<HTMLElement>(initialFocusSelector);
        if (target) {
          target.focus({ preventScroll: true });
          return;
        }
      }
      const firstFocusable = ref.current.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      firstFocusable?.focus({ preventScroll: true });
    });

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
      if (lockScroll) {
        document.body.style.overflow = originalOverflow;
      }
      previouslyFocusedElementRef.current?.focus({ preventScroll: true });
    };
  }, [isOpen, closeOnEscape, lockScroll, initialFocusSelector, ref]);

  return ref;
}
