import { useCallback, useEffect, useState } from "react";
import type { UserSession } from "../App";
import { backend } from "../declarations/backend";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const b = backend as any;

type Tab =
  | "dashboard"
  | "orders"
  | "delivery_boys"
  | "shops"
  | "shifts"
  | "payments"
  | "settings";

interface Props {
  session: UserSession;
  onLogout: () => void;
}

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

export default function AdminPanel({ session, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [deliveryCharge, setDeliveryCharge] = useState(30);
  const [dbFilter, setDbFilter] = useState<
    "all" | "online" | "offline" | "on_shift"
  >("all");

  // Dialogs
  const [showAddDB, setShowAddDB] = useState(false);
  const [showEditDB, setShowEditDB] = useState<any>(null);
  const [showAddShop, setShowAddShop] = useState(false);
  const [showEditShop, setShowEditShop] = useState<any>(null);
  const [showAddShift, setShowAddShift] = useState(false);
  const [showEditShift, setShowEditShift] = useState<any>(null);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showAssignDB, setShowAssignDB] = useState<any>(null);

  const loadAll = useCallback(async () => {
    const [s, o, dbs, sh, dc, shf] = await Promise.all([
      b.getDashboardStats(),
      b.getOrders(),
      b.getDeliveryBoys(),
      b.getShops(),
      b.getDeliveryCharge(),
      b.getShifts(),
    ]);
    setStats(s);
    setOrders(
      o.map((x: any) => ({
        ...x,
        id: Number(x.id),
        shopId: Number(x.shopId),
        deliveryBoyId:
          x.deliveryBoyId?.[0] != null ? Number(x.deliveryBoyId[0]) : null,
        amount: Number(x.amount),
        deliveryCharge: Number(x.deliveryCharge),
      })),
    );
    setDeliveryBoys(
      dbs.map((x: any) => ({
        ...x,
        id: Number(x.id),
        shiftId: x.shiftId?.[0] != null ? Number(x.shiftId[0]) : null,
        earnings: Number(x.earnings),
        codCollected: Number(x.codCollected),
      })),
    );
    setShops(sh.map((x: any) => ({ ...x, id: Number(x.id) })));
    setDeliveryCharge(Number(dc));
    setShifts(
      shf.map((x: any) => ({
        ...x,
        id: Number(x.id),
        maxUsers: Number(x.maxUsers),
      })),
    );
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const navItems: { id: Tab; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "orders", label: "Orders", icon: "📦" },
    { id: "delivery_boys", label: "Delivery Boys", icon: "🚚" },
    { id: "shops", label: "Shops", icon: "🏪" },
    { id: "shifts", label: "Shifts", icon: "⏰" },
    { id: "payments", label: "Payments", icon: "💰" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  const filteredDBs = deliveryBoys.filter((db) => {
    if (dbFilter === "online") return db.isOnline;
    if (dbFilter === "offline") return !db.isOnline;
    if (dbFilter === "on_shift") return db.shiftId != null;
    return true;
  });

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative lg:translate-x-0`}
      >
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">⚡</span>
            </div>
            <span className="text-white text-xl font-bold">Trencart</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => {
                setTab(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                tab === item.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
            <div>
              <p className="text-white text-sm font-medium">{session.name}</p>
              <p className="text-gray-400 text-xs">Admin</p>
            </div>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            size="sm"
            className="w-full text-gray-300 border-gray-600 hover:bg-gray-800"
          >
            Logout
          </Button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <span className="text-xl">☰</span>
          </button>
          <h2 className="font-semibold text-gray-800 flex-1">
            {navItems.find((n) => n.id === tab)?.label}
          </h2>
          <button
            type="button"
            onClick={loadAll}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            title="Refresh"
          >
            🔄
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {tab === "dashboard" && (
            <DashboardTab
              stats={stats}
              orders={orders}
              deliveryBoys={deliveryBoys}
              shifts={shifts}
            />
          )}
          {tab === "orders" && (
            <OrdersTab
              orders={orders}
              deliveryBoys={deliveryBoys}
              shops={shops}
              onRefresh={loadAll}
              showCreate={showCreateOrder}
              setShowCreate={setShowCreateOrder}
              showAssign={showAssignDB}
              setShowAssign={setShowAssignDB}
            />
          )}
          {tab === "delivery_boys" && (
            <DeliveryBoysTab
              deliveryBoys={filteredDBs}
              allDBs={deliveryBoys}
              shifts={shifts}
              filter={dbFilter}
              setFilter={setDbFilter}
              onRefresh={loadAll}
              showAdd={showAddDB}
              setShowAdd={setShowAddDB}
              showEdit={showEditDB}
              setShowEdit={setShowEditDB}
            />
          )}
          {tab === "shops" && (
            <ShopsTab
              shops={shops}
              onRefresh={loadAll}
              showAdd={showAddShop}
              setShowAdd={setShowAddShop}
              showEdit={showEditShop}
              setShowEdit={setShowEditShop}
            />
          )}
          {tab === "shifts" && (
            <ShiftsTab
              shifts={shifts}
              onRefresh={loadAll}
              showAdd={showAddShift}
              setShowAdd={setShowAddShift}
              showEdit={showEditShift}
              setShowEdit={setShowEditShift}
            />
          )}
          {tab === "payments" && (
            <PaymentsTab
              deliveryBoys={deliveryBoys}
              deliveryCharge={deliveryCharge}
              onRefresh={loadAll}
            />
          )}
          {tab === "settings" && (
            <SettingsTab deliveryCharge={deliveryCharge} onRefresh={loadAll} />
          )}
        </main>
      </div>
    </div>
  );
}

// ============ DASHBOARD TAB ============
function DashboardTab({ stats, orders, deliveryBoys }: any) {
  const recentOrders = [...orders].reverse().slice(0, 5);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon="📦"
          label="Total Orders"
          value={stats ? Number(stats.totalOrders) : 0}
          sub="All time"
          color="bg-blue-500"
        />
        <KpiCard
          icon="🟢"
          label="Online Riders"
          value={stats ? Number(stats.onlineDeliveryBoys) : 0}
          sub={`of ${stats ? Number(stats.totalDeliveryBoys) : 0} total`}
          color="bg-green-500"
        />
        <KpiCard
          icon="💰"
          label="Total Earnings"
          value={stats ? `₹${Number(stats.totalEarnings)}` : "₹0"}
          sub="Paid out"
          color="bg-orange-500"
        />
        <KpiCard
          icon="⏳"
          label="Pending"
          value={stats ? Number(stats.pendingOrders) : 0}
          sub="Awaiting"
          color="bg-red-500"
        />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentOrders.length === 0 && (
              <p className="text-gray-400 text-sm">No orders yet</p>
            )}
            {recentOrders.map((o: any) => (
              <div
                key={o.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">
                    #{o.id} - {o.customerName}
                  </p>
                  <p className="text-xs text-gray-500">{o.address}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[getStatusKey(o.status)]}`}
                >
                  {statusLabel[getStatusKey(o.status)]}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rider Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {deliveryBoys.length === 0 && (
              <p className="text-gray-400 text-sm">No delivery boys yet</p>
            )}
            {deliveryBoys.slice(0, 6).map((db: any) => (
              <div
                key={db.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                    {db.name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{db.name}</p>
                    <p className="text-xs text-gray-500">{db.phone}</p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${db.isOnline ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  {db.isOnline ? "Online" : "Offline"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, sub, color }: any) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div
          className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-lg mb-3`}
        >
          {icon}
        </div>
        <p className="text-gray-500 text-xs">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

// ============ ORDERS TAB ============
function OrdersTab({
  orders,
  deliveryBoys,
  shops,
  onRefresh,
  showCreate,
  setShowCreate,
  showAssign,
  setShowAssign,
}: any) {
  const [form, setForm] = useState({
    shopId: "",
    customerName: "",
    phone: "",
    address: "",
    items: "",
    paymentType: "cod",
    amount: "",
  });
  const [loading, setLoading] = useState(false);

  const createOrder = async () => {
    if (!form.shopId || !form.customerName || !form.phone || !form.address)
      return;
    setLoading(true);
    try {
      const pt = form.paymentType === "cod" ? { cod: null } : { online: null };
      await b.createOrder(
        BigInt(form.shopId),
        form.customerName,
        form.phone,
        form.address,
        form.items,
        pt,
        BigInt(form.amount || "0"),
      );
      setShowCreate(false);
      setForm({
        shopId: "",
        customerName: "",
        phone: "",
        address: "",
        items: "",
        paymentType: "cod",
        amount: "",
      });
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const assignDB = async (orderId: number, dbId: number) => {
    await b.assignDeliveryBoy(BigInt(orderId), BigInt(dbId));
    setShowAssign(null);
    onRefresh();
  };

  const shopName = (id: number) =>
    shops.find((s: any) => s.id === id)?.name || `Shop #${id}`;
  const dbName = (id: number | null) =>
    id == null
      ? "Unassigned"
      : deliveryBoys.find((d: any) => d.id === id)?.name || `Rider #${id}`;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-700">
          All Orders ({orders.length})
        </h3>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          + Create Order
        </Button>
      </div>
      <div className="space-y-3">
        {orders.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-gray-400">
              No orders yet. Create the first one!
            </CardContent>
          </Card>
        )}
        {[...orders].reverse().map((o: any) => (
          <Card key={o.id}>
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-800">#{o.id}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[getStatusKey(o.status)]}`}
                    >
                      {statusLabel[getStatusKey(o.status)]}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${"cod" in (o.paymentType || {}) ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}
                    >
                      {"cod" in (o.paymentType || {}) ? "COD" : "Online"}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-700 mt-1">
                    {o.customerName} · {o.phone}
                  </p>
                  <p className="text-xs text-gray-500">{o.address}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Shop: {shopName(o.shopId)} · Rider:{" "}
                    {dbName(o.deliveryBoyId)} · ₹{o.amount} + ₹
                    {o.deliveryCharge} charge
                  </p>
                </div>
                <div className="flex gap-2">
                  {o.deliveryBoyId == null && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAssign(o)}
                    >
                      Assign
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Order Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select
              value={form.shopId}
              onValueChange={(v) => setForm({ ...form, shopId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Shop" />
              </SelectTrigger>
              <SelectContent>
                {shops.map((s: any) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Customer Name"
              value={form.customerName}
              onChange={(e) =>
                setForm({ ...form, customerName: e.target.value })
              }
            />
            <Input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              placeholder="Delivery Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <Input
              placeholder="Items (e.g. 2x Burger, 1x Fries)"
              value={form.items}
              onChange={(e) => setForm({ ...form, items: e.target.value })}
            />
            <Select
              value={form.paymentType}
              onValueChange={(v) => setForm({ ...form, paymentType: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cod">Cash on Delivery (COD)</SelectItem>
                <SelectItem value="online">Online Payment</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Order Amount (₹)"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              onClick={createOrder}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Creating..." : "Create Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={!!showAssign} onOpenChange={() => setShowAssign(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Delivery Boy</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 mb-3">
            Prefer Online + On-Shift riders
          </p>
          <div className="space-y-2">
            {deliveryBoys
              .sort((a: any, b: any) => {
                const aScore =
                  (a.isOnline ? 2 : 0) + (a.shiftId != null ? 1 : 0);
                const bScore =
                  (b.isOnline ? 2 : 0) + (b.shiftId != null ? 1 : 0);
                return bScore - aScore;
              })
              .map((db: any) => (
                <button
                  type="button"
                  key={db.id}
                  onClick={() => assignDB(showAssign.id, db.id)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                      {db.name[0]}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">{db.name}</p>
                      <p className="text-xs text-gray-500">
                        {db.shiftId != null ? "On Shift" : "No Shift"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${db.isOnline ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {db.isOnline ? "Online" : "Offline"}
                  </span>
                </button>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ DELIVERY BOYS TAB ============
function DeliveryBoysTab({
  deliveryBoys,
  // allDBs,
  shifts,
  filter,
  setFilter,
  onRefresh,
  showAdd,
  setShowAdd,
  showEdit,
  setShowEdit,
}: any) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const addDB = async () => {
    if (!form.name || !form.email || !form.password) return;
    setLoading(true);
    try {
      await b.addDeliveryBoy(form.name, form.phone, form.email, form.password);
      setShowAdd(false);
      setForm({ name: "", phone: "", email: "", password: "" });
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const updateDB = async () => {
    if (!showEdit) return;
    setLoading(true);
    try {
      await b.updateDeliveryBoy(
        BigInt(showEdit.id),
        form.name || showEdit.name,
        form.phone || showEdit.phone,
        form.email || showEdit.email,
      );
      setShowEdit(null);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const deleteDB = async (id: number) => {
    if (!confirm("Delete this delivery boy?")) return;
    await b.deleteDeliveryBoy(BigInt(id));
    onRefresh();
  };

  const shiftName = (id: number | null) =>
    id == null
      ? "No Shift"
      : shifts.find((s: any) => s.id === id)?.name || `Shift #${id}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex gap-2 flex-wrap">
          {(["all", "online", "offline", "on_shift"] as const).map((f) => (
            <button
              type="button"
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f === "all"
                ? "All"
                : f === "on_shift"
                  ? "On Shift"
                  : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <Button
          onClick={() => {
            setForm({ name: "", phone: "", email: "", password: "" });
            setShowAdd(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          + Add Rider
        </Button>
      </div>
      <div className="space-y-3">
        {deliveryBoys.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-gray-400">
              No delivery boys found
            </CardContent>
          </Card>
        )}
        {deliveryBoys.map((db: any) => (
          <Card key={db.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {db.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{db.name}</p>
                    <p className="text-xs text-gray-500">
                      {db.phone} · {db.email}
                    </p>
                    <p className="text-xs text-gray-400">
                      {shiftName(db.shiftId)} · ₹{db.earnings} earned · ₹
                      {db.codCollected} COD
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${db.isOnline ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {db.isOnline ? "Online" : "Offline"}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setForm({
                          name: db.name,
                          phone: db.phone,
                          email: db.email,
                          password: "",
                        });
                        setShowEdit(db);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => deleteDB(db.id)}
                    >
                      Del
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Delivery Boy</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button
              onClick={addDB}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Delivery Boy</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(null)}>
              Cancel
            </Button>
            <Button
              onClick={updateDB}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ SHOPS TAB ============
function ShopsTab({
  shops,
  onRefresh,
  showAdd,
  setShowAdd,
  showEdit,
  setShowEdit,
}: any) {
  const [form, setForm] = useState({
    name: "",
    location: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const addShop = async () => {
    if (!form.name || !form.email) return;
    setLoading(true);
    try {
      await b.addShop(form.name, form.location, form.email, form.password);
      setShowAdd(false);
      setForm({ name: "", location: "", email: "", password: "" });
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const updateShop = async () => {
    if (!showEdit) return;
    setLoading(true);
    try {
      await b.updateShop(
        BigInt(showEdit.id),
        form.name || showEdit.name,
        form.location || showEdit.location,
        form.email || showEdit.email,
      );
      setShowEdit(null);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const deleteShop = async (id: number) => {
    if (!confirm("Delete this shop?")) return;
    await b.deleteShop(BigInt(id));
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-700">Shops ({shops.length})</h3>
        <Button
          onClick={() => {
            setForm({ name: "", location: "", email: "", password: "" });
            setShowAdd(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          + Add Shop
        </Button>
      </div>
      <div className="space-y-3">
        {shops.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-gray-400">
              No shops yet
            </CardContent>
          </Card>
        )}
        {shops.map((s: any) => (
          <Card key={s.id}>
            <CardContent className="pt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-lg">
                  🏪
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-500">
                    {s.location} · {s.email}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setForm({
                      name: s.name,
                      location: s.location,
                      email: s.email,
                      password: "",
                    });
                    setShowEdit(s);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200"
                  onClick={() => deleteShop(s.id)}
                >
                  Del
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Shop</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Shop Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Location / Address"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <Input
              placeholder="Login Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button
              onClick={addShop}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Shop</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <Input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(null)}>
              Cancel
            </Button>
            <Button
              onClick={updateShop}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ SHIFTS TAB ============
function ShiftsTab({
  shifts,
  onRefresh,
  showAdd,
  setShowAdd,
  showEdit,
  setShowEdit,
}: any) {
  const [form, setForm] = useState({
    name: "Morning",
    startTime: "",
    endTime: "",
    maxUsers: "5",
  });
  const [loading, setLoading] = useState(false);

  const addShift = async () => {
    if (!form.name || !form.startTime || !form.endTime) return;
    setLoading(true);
    try {
      await b.addShift(
        form.name,
        form.startTime,
        form.endTime,
        BigInt(form.maxUsers || "5"),
      );
      setShowAdd(false);
      setForm({ name: "Morning", startTime: "", endTime: "", maxUsers: "5" });
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const updateShift = async () => {
    if (!showEdit) return;
    setLoading(true);
    try {
      await b.updateShift(
        BigInt(showEdit.id),
        form.name,
        form.startTime,
        form.endTime,
        BigInt(form.maxUsers || "5"),
      );
      setShowEdit(null);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const deleteShift = async (id: number) => {
    if (!confirm("Delete this shift?")) return;
    await b.deleteShift(BigInt(id));
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-700">
          Shifts ({shifts.length})
        </h3>
        <Button
          onClick={() => {
            setForm({
              name: "Morning",
              startTime: "",
              endTime: "",
              maxUsers: "5",
            });
            setShowAdd(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          + Add Shift
        </Button>
      </div>
      <div className="space-y-3">
        {shifts.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-gray-400">
              No shifts yet
            </CardContent>
          </Card>
        )}
        {shifts.map((s: any) => (
          <Card key={s.id}>
            <CardContent className="pt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-lg">
                  ⏰
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-500">
                    {s.startTime} - {s.endTime} · Max {s.maxUsers} riders
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setForm({
                      name: s.name,
                      startTime: s.startTime,
                      endTime: s.endTime,
                      maxUsers: String(s.maxUsers),
                    });
                    setShowEdit(s);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200"
                  onClick={() => deleteShift(s.id)}
                >
                  Del
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select
              value={form.name}
              onValueChange={(v) => setForm({ ...form, name: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Morning">Morning</SelectItem>
                <SelectItem value="Evening">Evening</SelectItem>
                <SelectItem value="Night">Night</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Start Time (e.g. 06:00)"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
            <Input
              placeholder="End Time (e.g. 14:00)"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
            <Input
              placeholder="Max Riders"
              type="number"
              value={form.maxUsers}
              onChange={(e) => setForm({ ...form, maxUsers: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button
              onClick={addShift}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select
              value={form.name}
              onValueChange={(v) => setForm({ ...form, name: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Morning">Morning</SelectItem>
                <SelectItem value="Evening">Evening</SelectItem>
                <SelectItem value="Night">Night</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Start Time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
            <Input
              placeholder="End Time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
            <Input
              placeholder="Max Riders"
              type="number"
              value={form.maxUsers}
              onChange={(e) => setForm({ ...form, maxUsers: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(null)}>
              Cancel
            </Button>
            <Button
              onClick={updateShift}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ PAYMENTS TAB ============
function PaymentsTab({ deliveryBoys, deliveryCharge, onRefresh }: any) {
  const [charge, setCharge] = useState(String(deliveryCharge));
  const [saving, setSaving] = useState(false);

  const saveCharge = async () => {
    setSaving(true);
    try {
      await b.setDeliveryCharge(BigInt(charge || "0"));
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delivery Charge Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-center">
            <Input
              placeholder="₹"
              type="number"
              value={charge}
              onChange={(e) => setCharge(e.target.value)}
              className="max-w-[120px]"
            />
            <Button
              onClick={saveCharge}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? "Saving..." : "Set Charge"}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Current: ₹{deliveryCharge}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delivery Boy Earnings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {deliveryBoys.length === 0 && (
            <p className="text-gray-400 text-sm">No delivery boys</p>
          )}
          {deliveryBoys.map((db: any) => (
            <div
              key={db.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">
                  {db.name[0]}
                </div>
                <div>
                  <p className="font-medium text-sm">{db.name}</p>
                  <p className="text-xs text-gray-400">
                    COD: ₹{db.codCollected} collected
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">₹{db.earnings}</p>
                <p className="text-xs text-gray-400">earned</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ============ SETTINGS TAB ============
function SettingsTab({ deliveryCharge, onRefresh }: any) {
  const [charge, setCharge] = useState(String(deliveryCharge));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await b.setDeliveryCharge(BigInt(charge || "0"));
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">App Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label
              htmlFor="delivery-charge-input"
              className="text-sm font-medium text-gray-700 mb-1 block"
            >
              Default Delivery Charge (₹)
            </label>
            <div className="flex gap-3">
              <Input
                type="number"
                value={charge}
                onChange={(e) => setCharge(e.target.value)}
                className="max-w-[150px]"
              />
              <Button
                onClick={save}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
