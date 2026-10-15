/**
 * Database Entity Contracts (aligned with Drizzle schemas and clean seeds).
 */

export interface Branch {
  id: string;
  name: string;
  slug: string;
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
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type SaleUnit = "UNIT" | "WEIGHT";

export interface Product {
  id: string;
  category_id: string;
  code?: string | null;
  barcode?: string | null;
  name: string;
  description: string | null;
  sale_unit: SaleUnit;
  image_urls: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BranchProduct {
  id: string;
  branch_id: string;
  product_id: string;
  price: number;
  promotional_price: number | null;
  is_on_sale: boolean;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Combo {
  id: string;
  name: string;
  description: string | null;
  image_urls: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComboItem {
  id: string;
  combo_id: string;
  product_id: string;
  quantity: number;
}

export interface BranchCombo {
  id: string;
  branch_id: string;
  combo_id: string;
  price: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "ADMIN_GENERAL" | "BRANCH_ADMIN";
  branch_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
