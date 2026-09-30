import { ProductCard } from "../components/ProductCard";
import { fetchProducts } from "../lib/api";

export const metadata = { title: "ShopDemo" };

export default async function ProductListPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const { products, page } = await fetchProducts({
    q: searchParams.q,
    page: Number(searchParams.page ?? 1),
  });

  return (
    <main>
      <h1>All products</h1>

      <form action="/" method="get" role="search">
        <label htmlFor="q">Search products</label>
        <input id="q" name="q" defaultValue={searchParams.q ?? ""} />
        <button type="submit">Search</button>
      </form>

      {products.length === 0 ? (
        <p data-testid="no-products">No products match that search.</p>
      ) : (
        <ul data-testid="product-grid">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}

      <nav aria-label="Pagination">
        {page > 1 ? <a href={`/?page=${page - 1}`}>Previous</a> : null}
        <a href={`/?page=${page + 1}`}>Next</a>
      </nav>
    </main>
  );
}
