import { useCallback, useEffect, useState } from "react";
import type { UserSession } from "../App";
import { backend } from "../declarations/backend";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const b = backend as any;

interface Props {
  session: UserSession;
  onLogout: () => void;
}

const statusLabel: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  going_to_shop: "Going to Shop",
  reached_shop: "Rider at Shop",
  picked: "Picked Up",
  delivering: "On the Way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-blue-100 text-blue-700",
  going_to_shop: "bg-purple-100 text-purple-700",
  reached_shop: "bg-indigo-100 text-indigo-700",
  picked: "bg-cyan-100 text-cyan-700",
  delivering: "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function getStatusKey(status: any): string {
  if (!status || typeof status !== "object") return "pending";
  return Object.keys(status)[0] || "pending";
}

export default function ShopPanel({ session, onLogout }: Props) {
  const [orders, setOrders] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  const loadOrders = useCallback(async () => {
    const o = await b.getOrdersForShop(BigInt(session.userId));
    setOrders(
      o.map((x: any) => ({
        ...x,
        id: Number(x.id),
        amount: Number(x.amount),
        deliveryCharge: Number(x.deliveryCharge),
      })),
    );
  }, [session.userId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const active = orders.filter(
    (o) =>
      getStatusKey(o.status) !== "delivered" &&
      getStatusKey(o.status) !== "cancelled",
  );
  const completed = orders.filter(
    (o) => getStatusKey(o.status) === "delivered",
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-gray-900 text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center text-lg">
            🏪
          </div>
          <div>
            <p className="font-semibold">{session.name}</p>
            <p className="text-xs text-gray-400">Shop Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadOrders}
            className="text-gray-400 hover:text-white"
          >
            🔄
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="text-gray-400 hover:text-white text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {active.length}
              </p>
              <p className="text-xs text-gray-500">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {completed.length}
              </p>
              <p className="text-xs text-gray-500">Delivered</p>
            </CardContent>
          </Card>
        </div>

        <h3 className="font-semibold text-gray-700">Active Orders</h3>
        {active.length === 0 && (
          <Card>
            <CardContent className="py-6 text-center text-gray-400">
              No active orders
            </CardContent>
          </Card>
        )}
        {active.map((o) => (
          <Card
            key={o.id}
            className="cursor-pointer"
            onClick={() => setSelected(selected?.id === o.id ? null : o)}
          >
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold">
                    #{o.id} - {o.customerName}
                  </p>
                  <p className="text-sm text-gray-500">{o.phone}</p>
                  <p className="text-xs text-gray-400">{o.address}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[getStatusKey(o.status)]}`}
                >
                  {statusLabel[getStatusKey(o.status)]}
                </span>
              </div>
              {selected?.id === o.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Items:</span>{" "}
                    {o.items || "Not specified"}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Amount:</span> ₹{o.amount}{" "}
                    {"cod" in (o.paymentType || {}) ? "(COD)" : "(Online)"}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Status:</span>{" "}
                    {statusLabel[getStatusKey(o.status)]}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {completed.length > 0 && (
          <>
            <h3 className="font-semibold text-gray-700">Completed Orders</h3>
            {completed.map((o) => (
              <Card key={o.id} className="opacity-70">
                <CardContent className="pt-3 pb-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">
                      #{o.id} - {o.customerName}
                    </p>
                    <p className="text-xs text-gray-400">₹{o.amount}</p>
                  </div>
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                    Delivered
                  </span>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </main>
    </div>
  );
}
