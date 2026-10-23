import { useMemo, useReducer, type ReactNode } from "react";
import { CartContext, type CartContextValue } from "./cart-context";
import { cartReducer, countCartItems, initialCartState } from "./cart-reducer";
import { captureAnalyticsEvent } from "@/app/analytics/posthog";

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);

  const value = useMemo<CartContextValue>(
    () => ({
      state,
      itemCount: countCartItems(state),
      addProduct: (branchSlug, productId, quantity, portion) => {
        dispatch({ type: "add", branchSlug, productId, quantity, portion });
        captureAnalyticsEvent("add_to_cart", {
          product_id: productId,
          quantity: quantity ?? 1,
        });
      },
      decrementProduct: (productId, portion) =>
        dispatch({ type: "decrement", productId, portion }),
      setProductQuantity: (productId, quantity, portion) =>
        dispatch({ type: "setQuantity", productId, quantity, portion }),
      removeProduct: (productId, portion) =>
        dispatch({ type: "remove", productId, portion }),
      clear: () => dispatch({ type: "clear" }),
      dispatch,
    }),
    [state]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
