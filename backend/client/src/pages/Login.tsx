import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Login() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.auth.login.useMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }
    if (!formData.password) {
      setError("Password is required");
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginMutation.mutateAsync({
        email: formData.email,
        password: formData.password,
      });

      if (result.user.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/customer");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ background: "var(--surface)" }}>
      <Card style={{ background: "var(--white)", borderColor: "var(--border-ss)" }} className="w-full max-w-md border">
        <CardHeader>
          <CardTitle style={{ color: "var(--ink)", fontFamily: "var(--fd)" }}>Login</CardTitle>
          <CardDescription style={{ color: "var(--ink-2)" }}>
            Sign in to your Student Sites account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert style={{ background: "var(--accent-light)", borderColor: "var(--accent-ss)" }}>
                <AlertCircle className="h-4 w-4" style={{ color: "var(--accent-ss)" }} />
                <AlertDescription style={{ color: "var(--accent-ss)" }}>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--ink)" }}>
                Email
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                style={{ borderColor: "var(--border-ss)" }}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--ink)" }}>
                Password
              </label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                style={{ borderColor: "var(--border-ss)" }}
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              style={{ background: "var(--primary-ss)" }}
              className="w-full text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <p className="text-center text-sm" style={{ color: "var(--ink-2)" }}>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setLocation("/signup")}
                style={{ color: "var(--primary-ss)" }}
                className="font-semibold hover:underline"
              >
                Sign Up
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
