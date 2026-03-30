import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const statusColors: Record<string, string> = {
  pending_payment: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  delivered: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
};

const paymentStatusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export default function OrdersManagement() {
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const { data: orders, isLoading } = trpc.orders.getAllOrders.useQuery({
    status: selectedStatus,
    limit: 100,
  });

  const updateStatusMutation = trpc.orders.updateOrderStatus.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh data
      trpc.useUtils().orders.getAllOrders.invalidate();
    },
  });

  const markDeliveredMutation = trpc.orders.markAsDelivered.useMutation({
    onSuccess: () => {
      trpc.useUtils().orders.getAllOrders.invalidate();
    },
  });

  const handleStatusChange = (orderId: number, newStatus: string) => {
    updateStatusMutation.mutate({
      orderId,
      status: newStatus as "pending_payment" | "in_progress" | "delivered" | "completed",
    });
  };

  const handleMarkDelivered = (orderId: number) => {
    markDeliveredMutation.mutate({ orderId });
  };

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedStatus || ""} onValueChange={(value) => setSelectedStatus(value || undefined)}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Filter by status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Orders</SelectItem>
              <SelectItem value="pending_payment">Pending Payment</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>Total: {orders?.length || 0} orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders && orders.length > 0 ? (
                  orders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.orderId}</TableCell>
                      <TableCell>{order.formData?.fullName || "N/A"}</TableCell>
                      <TableCell className="capitalize">{order.packageType}</TableCell>
                      <TableCell>${order.price}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status] || "bg-gray-100"}>
                          {order.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={paymentStatusColors[order.paymentStatus] || "bg-gray-100"}>
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(order)}
                          >
                            View
                          </Button>
                          {order.status === "in_progress" && (
                            <Button
                              size="sm"
                              onClick={() => handleMarkDelivered(order.id)}
                              disabled={markDeliveredMutation.isPending}
                            >
                              Deliver
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>{selectedOrder?.orderId}</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => handleStatusChange(selectedOrder.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending_payment">Pending Payment</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Status</p>
                  <Badge className={paymentStatusColors[selectedOrder.paymentStatus]}>
                    {selectedOrder.paymentStatus}
                  </Badge>
                </div>
              </div>

              {/* Customer Info */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p>{selectedOrder.formData?.fullName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p>{selectedOrder.formData?.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">School</p>
                    <p>{selectedOrder.formData?.schoolName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Grade</p>
                    <p>{selectedOrder.formData?.grade || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Order Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Package</p>
                    <p className="capitalize">{selectedOrder.packageType}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Price</p>
                    <p>${selectedOrder.price}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p>{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Delivered</p>
                    <p>
                      {selectedOrder.deliveryDate
                        ? new Date(selectedOrder.deliveryDate).toLocaleDateString()
                        : "Not delivered"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Files */}
              {selectedOrder.files && selectedOrder.files.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Delivered Files</h3>
                  <div className="space-y-2">
                    {selectedOrder.files.map((file: any) => (
                      <div key={file.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{file.fileName}</span>
                        <span className="text-xs text-muted-foreground">
                          {file.fileSize ? `${(file.fileSize / 1024 / 1024).toFixed(2)} MB` : "N/A"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
