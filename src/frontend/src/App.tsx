import { useState } from "react";
import AdminPanel from "./components/AdminPanel";
import DeliveryBoyPanel from "./components/DeliveryBoyPanel";
import LoginPage from "./components/LoginPage";
import ShopPanel from "./components/ShopPanel";

export type UserSession = {
  role: "admin" | "delivery_boy" | "shop";
  userId: number;
  name: string;
};

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);

  if (!session) {
    return <LoginPage onLogin={setSession} />;
  }

  if (session.role === "admin") {
    return <AdminPanel session={session} onLogout={() => setSession(null)} />;
  }

  if (session.role === "delivery_boy") {
    return (
      <DeliveryBoyPanel session={session} onLogout={() => setSession(null)} />
    );
  }

  return <ShopPanel session={session} onLogout={() => setSession(null)} />;
}
