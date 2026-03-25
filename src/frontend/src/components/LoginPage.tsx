import { useState } from "react";
import type { UserSession } from "../App";
import { backend } from "../declarations/backend";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

interface Props {
  onLogin: (session: UserSession) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await (backend as any).login(email, password);
      if ("ok" in result) {
        const { role, userId, name } = result.ok;
        let roleStr: "admin" | "delivery_boy" | "shop" = "delivery_boy";
        if ("admin" in role) roleStr = "admin";
        else if ("shop" in role) roleStr = "shop";
        else if ("delivery_boy" in role) roleStr = "delivery_boy";
        onLogin({ role: roleStr, userId: Number(userId), name });
      } else {
        setError(result.err || "Invalid Credentials");
      }
    } catch (_e) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <span className="text-white text-3xl">&#9889;</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Trencart</h1>
          <p className="text-gray-400 mt-1">Delivery Management System</p>
        </div>
        <Card className="bg-white/10 border-white/20 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white text-center">Sign In</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              data-ocid="login.input"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 h-12"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <Input
              data-ocid="login.password.input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 h-12"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            {error && (
              <p
                data-ocid="login.error_state"
                className="text-red-400 text-sm text-center"
              >
                {error}
              </p>
            )}
            <Button
              data-ocid="login.submit_button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
