import { useMemo, useReducer, type ReactNode } from "react";
import { CartContext, type CartContextValue } from "./cart-context";
import { cartReducer, countCartItems, initialCartState } from "./cart-reducer";

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);

  const value = useMemo<CartContextValue>(
    () => ({
      state,
      itemCount: countCartItems(state),
      addProduct: (branchSlug, productId) => dispatch({ type: "add", branchSlug, productId }),
      removeProduct: (productId) => dispatch({ type: "remove", productId }),
      clear: () => dispatch({ type: "clear" }),
      dispatch,
    }),
    [state]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
