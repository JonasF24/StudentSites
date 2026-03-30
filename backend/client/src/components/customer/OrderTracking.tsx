import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

const statusColors: Record<string, string> = {
  pending_payment: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  delivered: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
};

const statusSteps = [
  { key: "pending_payment", label: "Payment Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "delivered", label: "Delivered" },
  { key: "completed", label: "Completed" },
];

export default function OrderTracking() {
  const [orderIdInput, setOrderIdInput] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearchOrder = async () => {
    if (!orderIdInput.trim()) return;

    setIsLoading(true);
    try {
      // This would call the trpc endpoint to fetch order
      // For now, showing placeholder
      console.log("Searching for order:", orderIdInput);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIndex = (status: string) => {
    return statusSteps.findIndex((step) => step.key === status);
  };

  return (
    <div className="space-y-6">
      {/* Search Order */}
      <Card style={{ background: "var(--white)", borderColor: "var(--border-ss)" }} className="border">
        <CardHeader>
          <CardTitle style={{ color: "var(--ink)", fontFamily: "var(--fd)" }}>Find Your Order</CardTitle>
          <CardDescription style={{ color: "var(--ink-2)" }}>
            Enter your order ID to track status and download files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter Order ID (e.g., ORD-1234567890-abcd1234)"
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearchOrder()}
              style={{ borderColor: "var(--border-ss)" }}
            />
            <Button
              onClick={handleSearchOrder}
              disabled={isLoading}
              style={{ background: "var(--primary-ss)" }}
              className="text-white"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Order Status Timeline */}
      {selectedOrder && (
        <Card style={{ background: "var(--white)", borderColor: "var(--border-ss)" }} className="border">
          <CardHeader>
            <CardTitle style={{ color: "var(--ink)", fontFamily: "var(--fd)" }}>Order Status</CardTitle>
            <CardDescription style={{ color: "var(--ink-2)" }}>{selectedOrder.orderId}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Timeline */}
              <div className="space-y-4">
                {statusSteps.map((step, index) => {
                  const isCompleted = getStatusIndex(selectedOrder.status) >= index;
                  const isCurrent = selectedOrder.status === step.key;

                  return (
                    <div key={step.key} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                          style={{
                            background: isCompleted
                              ? "var(--success-ss)"
                              : isCurrent
                              ? "var(--primary-ss)"
                              : "var(--surface-2)",
                            color: isCompleted || isCurrent ? "white" : "var(--ink-3)",
                          }}
                        >
                          {isCompleted ? "✓" : index + 1}
                        </div>
                        {index < statusSteps.length - 1 && (
                          <div
                            className="w-0.5 h-12 my-2"
                            style={{
                              background: isCompleted ? "var(--success-ss)" : "var(--border-ss)",
                            }}
                          />
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-medium" style={{ color: "var(--ink)" }}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-sm" style={{ color: "var(--ink-3)" }}>
                            Current status
                          </p>
                        )}
                        {isCompleted && !isCurrent && (
                          <p className="text-sm" style={{ color: "var(--ink-3)" }}>
                            Completed
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Details */}
              <div style={{ borderColor: "var(--border-ss)" }} className="border-t pt-4">
                <h3 className="font-semibold mb-3" style={{ color: "var(--ink)", fontFamily: "var(--fd)" }}>
                  Order Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p style={{ color: "var(--ink-3)" }}>Package</p>
                    <p className="capitalize font-medium" style={{ color: "var(--ink)" }}>
                      {selectedOrder.packageType}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: "var(--ink-3)" }}>Price</p>
                    <p className="font-medium" style={{ color: "var(--ink)" }}>
                      ${selectedOrder.price}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: "var(--ink-3)" }}>Created</p>
                    <p style={{ color: "var(--ink)" }}>
                      {new Date(selectedOrder.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: "var(--ink-3)" }}>Delivered</p>
                    <p style={{ color: "var(--ink)" }}>
                      {selectedOrder.deliveryDate
                        ? new Date(selectedOrder.deliveryDate).toLocaleDateString()
                        : "Not yet"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Files */}
              {selectedOrder.files && selectedOrder.files.length > 0 && (
                <div style={{ borderColor: "var(--border-ss)" }} className="border-t pt-4">
                  <h3 className="font-semibold mb-3" style={{ color: "var(--ink)", fontFamily: "var(--fd)" }}>
                    Your Website Files
                  </h3>
                  <div className="space-y-2">
                    {selectedOrder.files.map((file: any) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 rounded-lg transition"
                        style={{ background: "var(--surface-2)", borderColor: "var(--border-ss)" }}
                      >
                        <div className="flex-1">
                          <p className="font-medium" style={{ color: "var(--ink)" }}>
                            {file.fileName}
                          </p>
                          <p className="text-xs" style={{ color: "var(--ink-3)" }}>
                            {file.fileSize
                              ? `${(file.fileSize / 1024 / 1024).toFixed(2)} MB`
                              : "Size unknown"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleDownloadFile(file.downloadUrl, file.fileName)}
                          style={{ background: "var(--primary-ss)" }}
                          className="text-white"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Revisions Info */}
              {selectedOrder.status !== "pending_payment" && (
                <div
                  className="p-3 rounded"
                  style={{ background: "var(--primary-light)", borderColor: "var(--primary-ss)" }}
                >
                  <p className="text-sm" style={{ color: "var(--primary-ss)" }}>
                    <span className="font-semibold">5 Free Revisions Included:</span> You can request up to 5 revisions
                    within 60 days of delivery. Go to the Revisions tab to submit your requests.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!selectedOrder && !isLoading && (
        <Card style={{ background: "var(--white)", borderColor: "var(--border-ss)" }} className="border">
          <CardContent className="pt-8 pb-8 text-center">
            <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" style={{ color: "var(--ink-3)" }} />
            <p style={{ color: "var(--ink-3)" }}>Search for an order to view its status and download files</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
