import { OrderingGate } from "@/components/rooms/owner/OrderingGate";
import { RoomsPage } from "@/components/rooms/owner/pages/RoomsPage";

/** Thin route: the page component owns its head and spacing, like /locations. */
export default function RoomsRoute() {
  return (
    <OrderingGate>
      <RoomsPage />
    </OrderingGate>
  );
}
