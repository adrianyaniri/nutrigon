import type { WeightPortion } from "@/features/catalog/lib/portion-pricing";

export type { WeightPortion };

export interface CartLine {
  productId: string;
  quantity: number;
  portion?: WeightPortion;
}

export interface CartState {
  /** Cart contents are scoped to a branch: prices differ per branch. */
  branchSlug: string | null;
  lines: CartLine[];
}

export type CartAction =
  | {
      type: "add";
      branchSlug: string;
      productId: string;
      quantity?: number;
      portion?: WeightPortion;
    }
  | { type: "decrement"; productId: string; portion?: WeightPortion }
  | { type: "setQuantity"; productId: string; quantity: number; portion?: WeightPortion }
  | { type: "remove"; productId: string; portion?: WeightPortion }
  | { type: "clear" };

export const initialCartState: CartState = { branchSlug: null, lines: [] };

function isMatchingLine(
  line: CartLine,
  productId: string,
  portion?: WeightPortion
): boolean {
  return line.productId === productId && line.portion === portion;
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "add": {
      // Switching branch invalidates the previous cart (different prices/stock).
      const base: CartState =
        state.branchSlug === action.branchSlug
          ? state
          : { branchSlug: action.branchSlug, lines: [] };
      const addQty = action.quantity ?? 1;
      const existing = base.lines.find((line) =>
        isMatchingLine(line, action.productId, action.portion)
      );
      const lines = existing
        ? base.lines.map((line) =>
            isMatchingLine(line, action.productId, action.portion)
              ? { ...line, quantity: line.quantity + addQty }
              : line
          )
        : [
            ...base.lines,
            { productId: action.productId, quantity: addQty, portion: action.portion },
          ];
      return { branchSlug: base.branchSlug, lines };
    }
    case "decrement": {
      const existing = state.lines.find((line) =>
        isMatchingLine(line, action.productId, action.portion)
      );
      if (!existing) return state;
      if (existing.quantity <= 1) {
        return {
          ...state,
          lines: state.lines.filter(
            (line) => !isMatchingLine(line, action.productId, action.portion)
          ),
        };
      }
      return {
        ...state,
        lines: state.lines.map((line) =>
          isMatchingLine(line, action.productId, action.portion)
            ? { ...line, quantity: line.quantity - 1 }
            : line
        ),
      };
    }
    case "setQuantity": {
      const qty = Math.floor(action.quantity);
      if (qty <= 0) {
        return {
          ...state,
          lines: state.lines.filter(
            (line) => !isMatchingLine(line, action.productId, action.portion)
          ),
        };
      }
      return {
        ...state,
        lines: state.lines.map((line) =>
          isMatchingLine(line, action.productId, action.portion)
            ? { ...line, quantity: qty }
            : line
        ),
      };
    }
    case "remove": {
      const lines = state.lines.filter(
        (line) => !isMatchingLine(line, action.productId, action.portion)
      );
      return { ...state, lines };
    }
    case "clear":
      return initialCartState;
    default:
      return state;
  }
}

export function countCartItems(state: CartState): number {
  return state.lines.reduce((total, line) => total + line.quantity, 0);
}
