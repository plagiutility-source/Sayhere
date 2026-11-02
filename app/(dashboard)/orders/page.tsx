import { OrderingGate } from "@/components/rooms/owner/OrderingGate";
import { OrdersPage } from "@/components/rooms/owner/pages/OrdersPage";

/** Thin route: the page component owns its head and spacing, like /locations. */
export default function OrdersRoute() {
  return (
    <OrderingGate>
      <OrdersPage />
    </OrderingGate>
  );
}
