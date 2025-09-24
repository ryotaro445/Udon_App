export interface Menu {
  id: number;
  name: string;
  price: number;
  image?: string;
}

export type CartItem = { menuId: number; qty: number };

export type OrderStatus = "placed" | "cooking" | "served";

export interface OrderItemOut {
  menu_id: number | null;
  name: string;
  price: number;
  quantity: number;
}
export interface OrderDetailOut {
  id: number;
  status: OrderStatus;
  items: OrderItemOut[];
  total: number;
}

export type Comment = {
  id: number;
  user?: string;
  text: string;
  created_at: string;
};

export type TableInfo = { id: number; name: string; code: string };

export interface OrderItemIn { menu_id: number; quantity: number }
export interface OrderCreate { table_id: number; items: OrderItemIn[] }

export type Post = {
  id: number;
  title: string;
  body: string;
  author: string;
  created_at: string; 
  category?: string | null; 
  pinned?: boolean;
};