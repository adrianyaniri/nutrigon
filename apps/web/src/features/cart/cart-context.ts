import { createContext } from "react";
import type { CartAction, CartState } from "./cart-reducer";

export interface CartContextValue {
  state: CartState;
  itemCount: number;
  addProduct: (branchSlug: string, productId: string) => void;
  removeProduct: (productId: string) => void;
  clear: () => void;
  dispatch: (action: CartAction) => void;
}

export const CartContext = createContext<CartContextValue | null>(null);
