export interface CartLine {
  productId: string;
  quantity: number;
}

export interface CartState {
  /** Cart contents are scoped to a branch: prices differ per branch. */
  branchSlug: string | null;
  lines: CartLine[];
}

export type CartAction =
  | { type: "add"; branchSlug: string; productId: string }
  | { type: "remove"; productId: string }
  | { type: "clear" };

export const initialCartState: CartState = { branchSlug: null, lines: [] };

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "add": {
      // Switching branch invalidates the previous cart (different prices/stock).
      const base: CartState =
        state.branchSlug === action.branchSlug
          ? state
          : { branchSlug: action.branchSlug, lines: [] };
      const existing = base.lines.find((line) => line.productId === action.productId);
      const lines = existing
        ? base.lines.map((line) =>
            line.productId === action.productId ? { ...line, quantity: line.quantity + 1 } : line
          )
        : [...base.lines, { productId: action.productId, quantity: 1 }];
      return { branchSlug: base.branchSlug, lines };
    }
    case "remove": {
      const lines = state.lines.filter((line) => line.productId !== action.productId);
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
