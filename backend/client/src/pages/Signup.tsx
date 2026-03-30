import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Signup() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const signupMutation = trpc.auth.signup.useMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await signupMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      setSuccess(true);
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ background: "var(--surface)" }}>
      <Card style={{ background: "var(--white)", borderColor: "var(--border-ss)" }} className="w-full max-w-md border">
        <CardHeader>
          <CardTitle style={{ color: "var(--ink)", fontFamily: "var(--fd)" }}>Create Account</CardTitle>
          <CardDescription style={{ color: "var(--ink-2)" }}>
            Sign up to manage your website orders
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

            {success && (
              <Alert style={{ background: "var(--primary-light)", borderColor: "var(--primary-ss)" }}>
                <CheckCircle2 className="h-4 w-4" style={{ color: "var(--primary-ss)" }} />
                <AlertDescription style={{ color: "var(--primary-ss)" }}>
                  Account created! Redirecting to login...
                </AlertDescription>
              </Alert>
            )}

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--ink)" }}>
                Full Name
              </label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                style={{ borderColor: "var(--border-ss)" }}
                disabled={isLoading}
              />
            </div>

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
              <p className="text-xs mt-1" style={{ color: "var(--ink-3)" }}>
                At least 8 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--ink)" }}>
                Confirm Password
              </label>
              <Input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
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
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>

            <p className="text-center text-sm" style={{ color: "var(--ink-2)" }}>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setLocation("/login")}
                style={{ color: "var(--primary-ss)" }}
                className="font-semibold hover:underline"
              >
                Login
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
