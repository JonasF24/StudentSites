import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrdersManagement from "@/components/admin/OrdersManagement";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--surface)" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "var(--primary-ss)" }}></div>
          <p style={{ color: "var(--ink-3)" }} className="mt-4">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--surface)" }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--ink)", fontFamily: "var(--fd)" }}>
            Access Denied
          </h1>
          <p style={{ color: "var(--ink-3)" }}>You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--surface)" }} className="min-h-screen">
      <div style={{ borderColor: "var(--border-ss)" }} className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold" style={{ color: "var(--ink)", fontFamily: "var(--fd)" }}>
            Admin Dashboard
          </h1>
          <p style={{ color: "var(--ink-2)" }} className="mt-1">
            Manage orders and view analytics
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="orders">
              Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <OrdersManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
