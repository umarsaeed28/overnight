import { notFound, redirect } from "next/navigation";
import { fetchProduct, getSession } from "../../../../../lib/api";
import { ProductEditForm } from "../../../../../components/ProductEditForm";

export default async function AdminProductEditPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.userId) redirect("/login?next=/admin/products");
  if (!session.isAdmin) redirect("/");

  const product = await fetchProduct(params.id);
  if (!product) notFound();

  return (
    <main>
      <h1>Edit {product.name}</h1>
      <ProductEditForm product={product} />
    </main>
  );
}
