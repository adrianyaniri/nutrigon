import { Outlet } from "react-router-dom";
import { CartProvider } from "@/features/cart";

/** Layout for the public storefront; owns state shared across public pages (cart). */
export function PublicLayout() {
  return (
    <CartProvider>
      <Outlet />
    </CartProvider>
  );
}
