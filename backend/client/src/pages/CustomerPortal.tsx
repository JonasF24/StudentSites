import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import OrderTracking from "@/components/customer/OrderTracking";
import RevisionRequest from "@/components/customer/RevisionRequest";

export default function CustomerPortal() {
  const [activeTab, setActiveTab] = useState("orders");

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      <div style={{ borderColor: "var(--border-ss)" }} className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold" style={{ color: "var(--ink)", fontFamily: "var(--fd)" }}>
            My Orders
          </h1>
          <p style={{ color: "var(--ink-2)" }} className="mt-1">
            Track your website order status and request revisions
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders">My Orders</TabsTrigger>
            <TabsTrigger value="revisions">Revisions</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            <OrderTracking />
          </TabsContent>

          <TabsContent value="revisions" className="mt-6">
            <RevisionRequest />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
