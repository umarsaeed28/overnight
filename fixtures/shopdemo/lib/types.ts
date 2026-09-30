export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  priceCents: number;
  stock: number;
  isActive: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: string;
  token: string;
  items: CartItem[];
  shippingCents: number;
  totalCents: number;
  expiresAt: string;
}

export type OrderStatus = "PENDING_PAYMENT" | "PAID" | "SHIPPED" | "CANCELLED";

export interface Order {
  id: string;
  status: OrderStatus;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  createdAt: string;
  guestEmail: string | null;
  items: { id: string; quantity: number; priceCents: number; product: Product }[];
}

export interface Session {
  userId: string;
  email: string;
  isAdmin: boolean;
}
