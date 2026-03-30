import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, LogOut } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const handleAdminDashboard = () => {
    setLocation("/admin");
  };

  const handleCustomerPortal = () => {
    setLocation("/customer");
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      {/* Navigation */}
      <div style={{ borderColor: "var(--border-ss)" }} className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: "var(--ink)", fontFamily: "var(--fd)" }}>
            Student Sites
          </h1>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="text-sm" style={{ color: "var(--ink-2)" }}>
                  {user.email}
                </span>
                <Button
                  size="sm"
                  onClick={handleLogout}
                  style={{ background: "var(--accent-ss)" }}
                  className="text-white"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLocation("/login")}
                  style={{ borderColor: "var(--border-ss)", color: "var(--primary-ss)" }}
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={() => setLocation("/signup")}
                  style={{ background: "var(--primary-ss)" }}
                  className="text-white"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {!user ? (
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div>
              <h2 className="text-4xl font-bold mb-4" style={{ color: "var(--ink)", fontFamily: "var(--fd)" }}>
                Welcome to Student Sites
              </h2>
              <p className="text-lg" style={{ color: "var(--ink-2)" }}>
                Build your professional portfolio website to stand out in college applications and job searches.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card style={{ background: "var(--white)", borderColor: "var(--border-ss)" }} className="border">
                <CardHeader>
                  <CardTitle style={{ color: "var(--ink)", fontFamily: "var(--fd)" }}>For Students</CardTitle>
                  <CardDescription style={{ color: "var(--ink-2)" }}>
                    Create and manage your website order
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5" style={{ color: "var(--success-ss)" }} />
                      <span style={{ color: "var(--ink)" }}>Track your order status in real-time</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5" style={{ color: "var(--success-ss)" }} />
                      <span style={{ color: "var(--ink)" }}>Download your completed website</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5" style={{ color: "var(--success-ss)" }} />
                      <span style={{ color: "var(--ink)" }}>Request revisions (5 free revisions included)</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => setLocation("/signup")}
                    style={{ background: "var(--primary-ss)" }}
                    className="w-full text-white"
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              <Card style={{ background: "var(--white)", borderColor: "var(--border-ss)" }} className="border">
                <CardHeader>
                  <CardTitle style={{ color: "var(--ink)", fontFamily: "var(--fd)" }}>Admin Dashboard</CardTitle>
                  <CardDescription style={{ color: "var(--ink-2)" }}>
                    Manage orders and view analytics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5" style={{ color: "var(--success-ss)" }} />
                      <span style={{ color: "var(--ink)" }}>View all orders and analytics</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5" style={{ color: "var(--success-ss)" }} />
                      <span style={{ color: "var(--ink)" }}>Manage order status and revisions</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5" style={{ color: "var(--success-ss)" }} />
                      <span style={{ color: "var(--ink)" }}>Track revenue and conversion rates</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => setLocation("/login")}
                    style={{ background: "var(--accent-ss)" }}
                    className="w-full text-white"
                  >
                    Admin Login
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : user.role === "admin" ? (
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div>
              <h2 className="text-4xl font-bold mb-4" style={{ color: "var(--ink)", fontFamily: "var(--fd)" }}>
                Welcome Back, Admin
              </h2>
              <p className="text-lg" style={{ color: "var(--ink-2)" }}>
                You're logged in as an administrator. Access your dashboard to manage orders and view analytics.
              </p>
            </div>

            <Button
              onClick={handleAdminDashboard}
              size="lg"
              style={{ background: "var(--primary-ss)" }}
              className="text-white"
            >
              Go to Admin Dashboard
            </Button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div>
              <h2 className="text-4xl font-bold mb-4" style={{ color: "var(--ink)", fontFamily: "var(--fd)" }}>
                Welcome, {user.name}
              </h2>
              <p className="text-lg" style={{ color: "var(--ink-2)" }}>
                Access your order portal to track your website and request revisions.
              </p>
            </div>

            <Button
              onClick={handleCustomerPortal}
              size="lg"
              style={{ background: "var(--primary-ss)" }}
              className="text-white"
            >
              Go to My Orders
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
