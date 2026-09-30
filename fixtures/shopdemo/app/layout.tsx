import type { ReactNode } from "react";

export const metadata = {
  title: "ShopDemo",
  description: "A small demo storefront",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header>
          <a href="/">ShopDemo</a>
          <nav aria-label="Main">
            <a href="/cart">Cart</a>
            <a href="/orders">Orders</a>
            <a href="/login">Sign in</a>
          </nav>
        </header>
        {children}
        <footer>
          <p>ShopDemo is a fixture application. Nothing here ships.</p>
        </footer>
      </body>
    </html>
  );
}
