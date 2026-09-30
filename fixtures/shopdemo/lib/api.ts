import { cookies } from "next/headers";
import type { Cart, Order, Product, Session } from "./types";

const API_URL = process.env.API_URL ?? "http://localhost:4001";

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}/api${path}`, {
    headers: { cookie: cookies().toString() },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`GET ${path} failed with ${response.status}`);
  return (await response.json()) as T;
}

export async function fetchProducts(options: { q?: string; page?: number }) {
  const params = new URLSearchParams();
  if (options.q) params.set("q", options.q);
  if (options.page && options.page > 1) params.set("page", String(options.page));
  return get<{ products: Product[]; page: number; pageSize: number }>(
    `/products?${params.toString()}`,
  );
}

export async function fetchProduct(id: string): Promise<Product | null> {
  const response = await fetch(`${API_URL}/api/products/${id}`, { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GET /products/${id} failed`);
  return (await response.json()) as Product;
}

export async function fetchCart(): Promise<Cart> {
  return get<Cart>("/cart");
}

export async function fetchOrders(): Promise<{ orders: Order[] }> {
  return get<{ orders: Order[] }>("/orders");
}

export async function getSession(): Promise<Session | null> {
  const response = await fetch(`${API_URL}/api/session`, {
    headers: { cookie: cookies().toString() },
    cache: "no-store",
  });
  if (!response.ok) return null;
  return (await response.json()) as Session;
}
