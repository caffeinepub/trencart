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

type TabType = "orders" | "shifts" | "earnings";

const statusLabel: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  going_to_shop: "Going to Shop",
  reached_shop: "At Shop",
  picked: "Picked",
  delivering: "Delivering",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function getStatusKey(status: any): string {
  if (!status || typeof status !== "object") return "pending";
  return Object.keys(status)[0] || "pending";
}

export default function DeliveryBoyPanel({ session, onLogout }: Props) {
  const [tab, setTab] = useState<TabType>("orders");
  const [isOnline, setIsOnline] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [myInfo, setMyInfo] = useState<any>(null);
  const [toggling, setToggling] = useState(false);

  const loadData = useCallback(async () => {
    const [ords, shfts, bkgs, me] = await Promise.all([
      b.getOrdersForDeliveryBoy(BigInt(session.userId)),
      b.getShifts(),
      b.getBookingsForDeliveryBoy(BigInt(session.userId)),
      b.getDeliveryBoy(BigInt(session.userId)),
    ]);
    const mapped = ords.map((o: any) => ({
      ...o,
      id: Number(o.id),
      amount: Number(o.amount),
      deliveryCharge: Number(o.deliveryCharge),
    }));
    setOrders(mapped);
    setShifts(
      shfts.map((s: any) => ({
        ...s,
        id: Number(s.id),
        maxUsers: Number(s.maxUsers),
      })),
    );
    setBookings(
      bkgs.map((bk: any) => ({
        ...bk,
        id: Number(bk.id),
        shiftId: Number(bk.shiftId),
      })),
    );
    if (me && me.length > 0) {
      const info = {
        ...me[0],
        id: Number(me[0].id),
        earnings: Number(me[0].earnings),
        codCollected: Number(me[0].codCollected),
      };
      setMyInfo(info);
      setIsOnline(info.isOnline);
    }
  }, [session.userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleOnline = async () => {
    setToggling(true);
    try {
      await b.setDeliveryBoyOnline(BigInt(session.userId), !isOnline);
      setIsOnline(!isOnline);
      await loadData();
    } finally {
      setToggling(false);
    }
  };

  const advanceOrder = async (orderId: number, currentStatus: string) => {
    const nextMap: Record<string, any> = {
      pending: { accepted: null },
      accepted: { going_to_shop: null },
      going_to_shop: { reached_shop: null },
      reached_shop: { picked: null },
      picked: { delivering: null },
      delivering: { delivered: null },
    };
    const nextStatus = nextMap[currentStatus];
    if (!nextStatus) return;
    await b.updateOrderStatus(BigInt(orderId), nextStatus);
    await loadData();
  };

  const bookedShiftIds = new Set(bookings.map((bk) => bk.shiftId));
  const myShifts = shifts.filter((s) => bookedShiftIds.has(s.id));
  const availableShifts = shifts.filter((s) => !bookedShiftIds.has(s.id));

  const bookShift = async (shiftId: number) => {
    const result = await b.bookShift(BigInt(session.userId), BigInt(shiftId));
    if (!result) {
      alert("Could not book shift (may be full)");
      return;
    }
    await loadData();
  };

  const cancelShift = async (shiftId: number) => {
    await b.cancelShiftBooking(BigInt(session.userId), BigInt(shiftId));
    await loadData();
  };

  const activeOrders = orders.filter(
    (o) =>
      getStatusKey(o.status) !== "delivered" &&
      getStatusKey(o.status) !== "cancelled",
  );
  const completedOrders = orders.filter(
    (o) => getStatusKey(o.status) === "delivered",
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Bar */}
      <header className="bg-gray-900 text-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-bold">
              {session.name[0]}
            </div>
            <div>
              <p className="font-semibold text-sm">{session.name}</p>
              <p className="text-xs text-gray-400">Delivery Boy</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleOnline}
              disabled={toggling}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                isOnline
                  ? "bg-green-500 text-white"
                  : "bg-gray-600 text-gray-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${isOnline ? "bg-white" : "bg-gray-400"}`}
              />
              {isOnline ? "Online" : "Offline"}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="text-gray-400 hover:text-white text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="bg-white border-b border-gray-200 flex">
        {(["orders", "shifts", "earnings"] as TabType[]).map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === t
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500"
            }`}
          >
            {t === "orders"
              ? "📦 Orders"
              : t === "shifts"
                ? "⏰ Shifts"
                : "💰 Earnings"}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-8">
        {tab === "orders" && (
          <div className="space-y-4">
            {!isOnline && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-4 flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <p className="text-orange-700 text-sm font-medium">
                    You are offline. Go online to receive new orders.
                  </p>
                </CardContent>
              </Card>
            )}
            <h3 className="font-semibold text-gray-700">
              Active Orders ({activeOrders.length})
            </h3>
            {activeOrders.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-gray-400">
                  No active orders
                </CardContent>
              </Card>
            )}
            {activeOrders.map((o) => (
              <OrderCard key={o.id} order={o} onAdvance={advanceOrder} />
            ))}
            {completedOrders.length > 0 && (
              <>
                <h3 className="font-semibold text-gray-700">
                  Completed ({completedOrders.length})
                </h3>
                {completedOrders.slice(0, 3).map((o) => (
                  <Card key={o.id} className="opacity-60">
                    <CardContent className="pt-3 pb-3">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            #{o.id} - {o.customerName}
                          </p>
                          <p className="text-xs text-gray-500">
                            ₹{o.deliveryCharge} earned
                          </p>
                        </div>
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full self-center">
                          Delivered
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        )}

        {tab === "shifts" && (
          <div className="space-y-4">
            {myShifts.length > 0 && (
              <>
                <h3 className="font-semibold text-gray-700">
                  My Booked Shifts
                </h3>
                {myShifts.map((s) => (
                  <Card key={s.id} className="border-green-200">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-800">
                            🌅 {s.name} Shift
                          </p>
                          <p className="text-sm text-gray-500">
                            {s.startTime} - {s.endTime}
                          </p>
                          <p className="text-xs text-gray-400">
                            Max {s.maxUsers} riders
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                            Booked
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 text-xs"
                            onClick={() => cancelShift(s.id)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
            {availableShifts.length > 0 && (
              <>
                <h3 className="font-semibold text-gray-700">
                  Available Shifts
                </h3>
                {availableShifts.map((s) => (
                  <Card key={s.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {s.name} Shift
                          </p>
                          <p className="text-sm text-gray-500">
                            {s.startTime} - {s.endTime}
                          </p>
                          <p className="text-xs text-gray-400">
                            Max {s.maxUsers} riders
                          </p>
                        </div>
                        <Button
                          onClick={() => bookShift(s.id)}
                          className="bg-blue-600 hover:bg-blue-700 h-10"
                        >
                          Book
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
            {shifts.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-gray-400">
                  No shifts available
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {tab === "earnings" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {completedOrders.length}
                  </p>
                  <p className="text-xs text-gray-500">Deliveries</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    ₹{myInfo?.earnings || 0}
                  </p>
                  <p className="text-xs text-gray-500">Earned</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    ₹{myInfo?.codCollected || 0}
                  </p>
                  <p className="text-xs text-gray-500">COD</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Completed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {completedOrders.length === 0 && (
                  <p className="text-gray-400 text-sm">
                    No completed orders yet
                  </p>
                )}
                {completedOrders.map((o) => (
                  <div
                    key={o.id}
                    className="flex justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        #{o.id} {o.customerName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {"cod" in (o.paymentType || {}) ? "COD" : "Online"} · ₹
                        {o.amount}
                      </p>
                    </div>
                    <p className="text-green-600 font-semibold text-sm">
                      +₹{o.deliveryCharge}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

function OrderCard({
  order,
  onAdvance,
}: { order: any; onAdvance: (id: number, status: string) => void }) {
  const statusKey = getStatusKey(order.status);
  const statusColors: Record<string, string> = {
    pending: "border-l-amber-400",
    accepted: "border-l-blue-400",
    going_to_shop: "border-l-purple-400",
    reached_shop: "border-l-indigo-400",
    picked: "border-l-cyan-400",
    delivering: "border-l-orange-400",
  };

  const nextActionLabel: Record<string, string> = {
    pending: "Accept Order",
    accepted: "Go to Shop",
    going_to_shop: "Reached Shop",
    reached_shop: "Verify & Pick Up",
    picked: "Start Delivery",
    delivering: "Mark Delivered",
  };

  const nextAction = nextActionLabel[statusKey];
  const isCOD = "cod" in (order.paymentType || {});

  return (
    <Card
      className={`border-l-4 ${statusColors[statusKey] || "border-l-gray-300"}`}
    >
      <CardContent className="pt-4 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-gray-800">Order #{order.id}</p>
            <p className="text-sm text-gray-600">{order.customerName}</p>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              isCOD
                ? "bg-yellow-100 text-yellow-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {isCOD ? `COD ₹${order.amount}` : `Online ₹${order.amount}`}
          </span>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>📍 {order.address}</p>
          {order.items && <p>🛒 {order.items}</p>}
        </div>

        {/* Show customer call button when picked or delivering */}
        {(statusKey === "picked" || statusKey === "delivering") && (
          <a
            href={`tel:${order.phone}`}
            className="flex items-center justify-center gap-2 w-full h-10 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium"
          >
            📞 Call {order.customerName} ({order.phone})
          </a>
        )}

        {/* Maps button when going to shop */}
        {statusKey === "accepted" && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(order.address)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full h-10 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm font-medium"
          >
            🗺️ Open in Maps
          </a>
        )}

        {nextAction && (
          <Button
            onClick={() => onAdvance(order.id, statusKey)}
            className="w-full h-14 text-base font-bold bg-blue-600 hover:bg-blue-700"
          >
            {nextAction}
          </Button>
        )}

        <p className="text-center text-xs text-gray-400">
          {statusLabel[statusKey]}
        </p>
      </CardContent>
    </Card>
  );
}
