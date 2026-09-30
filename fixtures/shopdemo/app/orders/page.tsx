import { redirect } from "next/navigation";
import { fetchOrders, getSession } from "../../lib/api";
import { formatPrice } from "../../lib/format";

export const metadata = { title: "Your orders · ShopDemo" };

export default async function OrderHistoryPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/login?next=/orders");

  const { orders } = await fetchOrders();

  return (
    <main>
      <h1>Your orders</h1>

      {orders.length === 0 ? (
        <p data-testid="no-orders">You have not placed an order yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Placed</th>
              <th scope="col">Status</th>
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <a href={`/orders/${order.id}`}>{order.id.slice(0, 8)}</a>
                </td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td data-testid={`order-status-${order.id}`}>{order.status}</td>
                <td>{formatPrice(order.totalCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
