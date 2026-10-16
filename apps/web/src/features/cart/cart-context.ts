import { createContext } from "react";
import type { CartAction, CartState, WeightPortion } from "./cart-reducer";

export interface CartContextValue {
  state: CartState;
  itemCount: number;
  addProduct: (
    branchSlug: string,
    productId: string,
    quantity?: number,
    portion?: WeightPortion
  ) => void;
  decrementProduct: (productId: string, portion?: WeightPortion) => void;
  setProductQuantity: (productId: string, quantity: number, portion?: WeightPortion) => void;
  removeProduct: (productId: string, portion?: WeightPortion) => void;
  clear: () => void;
  dispatch: (action: CartAction) => void;
}

export const CartContext = createContext<CartContextValue | null>(null);
