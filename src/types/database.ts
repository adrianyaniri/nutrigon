/**
 * Preliminary Database Entity Contracts.
 * NOTE: These types reflect the architectural draft and are subject to validation.
 */

export interface Branch {
  id: string;
  code: "sucursal-1" | "sucursal-2" | "sucursal-3" | string;
  name: string;
  address: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export type SaleUnit = "unit" | "weight_kg" | "weight_g";

export interface Product {
  id: string;
  category_id: string | null;
  sku: string | null;
  name: string;
  description: string | null;
  sale_unit: SaleUnit;
  is_visible_web: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BranchPrice {
  id: string;
  product_id: string;
  branch_id: string;
  price: number;
  updated_at: string;
  updated_by: string | null;
}

export interface BranchInventory {
  id: string;
  product_id: string;
  branch_id: string;
  current_stock: number;
  min_stock_alert: number;
  updated_at: string;
}

export type MovementType = "in" | "out" | "adjustment" | "transfer";

export interface InventoryMovement {
  id: string;
  product_id: string;
  branch_id: string;
  movement_type: MovementType;
  quantity: number;
  reason: string;
  created_by: string | null;
  created_at: string;
}

export type SaleStatus = "completed" | "cancelled";

export interface Sale {
  id: string;
  branch_id: string;
  sale_number: string;
  total_amount: number;
  payment_method: string;
  status: SaleStatus;
  created_by: string | null;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}
