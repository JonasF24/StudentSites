import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const revisionStatusColors: Record<string, string> = {
  requested: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
};

export default function RevisionRequest() {
  const [orderIdInput, setOrderIdInput] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [revisionDescription, setRevisionDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearchOrder = async () => {
    if (!orderIdInput.trim()) return;

    setIsLoading(true);
    try {
      // This would call the trpc endpoint to fetch order
      console.log("Searching for order:", orderIdInput);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRevision = async () => {
    if (!revisionDescription.trim()) return;

    setIsSubmitting(true);
    try {
      // This would call the trpc endpoint to submit revision
      console.log("Submitting revision:", revisionDescription);
      setSubmitSuccess(true);
      setRevisionDescription("");
      setTimeout(() => setSubmitSuccess(false), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Order */}
      <Card style={{ background: "var(--white)", borderColor: "var(--border-ss)" }} className="border">
        <CardHeader>
          <CardTitle style={{ color: "var(--ink)", fontFamily: "var(--fd)" }}>Request a Revision</CardTitle>
          <CardDescription style={{ color: "var(--ink-2)" }}>
            Find your order and submit revision requests
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

      {/* Revision Info */}
      {selectedOrder && (
        <Card style={{ background: "var(--white)", borderColor: "var(--border-ss)" }} className="border">
          <CardHeader>
            <CardTitle style={{ color: "var(--ink)", fontFamily: "var(--fd)" }}>
              Revisions for {selectedOrder.orderId}
            </CardTitle>
            <CardDescription style={{ color: "var(--ink-2)" }}>
              You have {selectedOrder.revisionsRemaining || 5} free revisions remaining
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Revision Status */}
            <div>
              <h3 className="font-semibold mb-3" style={{ color: "var(--ink)", fontFamily: "var(--fd)" }}>
                Revision History
              </h3>
              {selectedOrder.revisions && selectedOrder.revisions.length > 0 ? (
                <div className="space-y-3">
                  {selectedOrder.revisions.map((revision: any) => (
                    <div
                      key={revision.id}
                      className="p-3 border rounded-lg space-y-2"
                      style={{ borderColor: "var(--border-ss)" }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium" style={{ color: "var(--ink)" }}>
                          Revision #{revision.revisionNumber}
                        </span>
                        <Badge className={revisionStatusColors[revision.status]}>
                          {revision.status}
                        </Badge>
                      </div>
                      <p className="text-sm" style={{ color: "var(--ink-2)" }}>
                        {revision.description}
                      </p>
                      <div className="flex justify-between text-xs" style={{ color: "var(--ink-3)" }}>
                        <span>Requested: {new Date(revision.requestedAt).toLocaleDateString()}</span>
                        {revision.completedAt && (
                          <span>Completed: {new Date(revision.completedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: "var(--ink-3)" }}>
                  No revisions requested yet
                </p>
              )}
            </div>

            {/* Submit New Revision */}
            {(selectedOrder.revisionsRemaining || 5) > 0 && (
              <div style={{ borderColor: "var(--border-ss)" }} className="border-t pt-4">
                <h3 className="font-semibold mb-3" style={{ color: "var(--ink)", fontFamily: "var(--fd)" }}>
                  Submit New Revision Request
                </h3>
                <div className="space-y-3">
                  <Textarea
                    placeholder="Describe the changes you'd like us to make..."
                    value={revisionDescription}
                    onChange={(e) => setRevisionDescription(e.target.value)}
                    rows={4}
                    className="resize-none"
                    style={{ borderColor: "var(--border-ss)" }}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmitRevision}
                      disabled={!revisionDescription.trim() || isSubmitting}
                      style={{ background: "var(--primary-ss)" }}
                      className="text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Revision Request"
                      )}
                    </Button>
                  </div>

                  {submitSuccess && (
                    <Alert style={{ background: "var(--accent-light)", borderColor: "var(--accent-ss)" }}>
                      <CheckCircle2 className="h-4 w-4" style={{ color: "var(--accent-ss)" }} />
                      <AlertDescription style={{ color: "var(--accent-ss)" }}>
                        Revision request submitted successfully! We'll get back to you soon.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}

            {/* No Revisions Left */}
            {(selectedOrder.revisionsRemaining || 5) === 0 && (
              <Alert style={{ background: "var(--accent-light)", borderColor: "var(--accent-ss)" }}>
                <AlertCircle className="h-4 w-4" style={{ color: "var(--accent-ss)" }} />
                <AlertDescription style={{ color: "var(--accent-ss)" }}>
                  You've used all 5 free revisions for this order. Additional revisions are available at a premium rate.
                </AlertDescription>
              </Alert>
            )}

            {/* Expiration Info */}
            {selectedOrder.deliveryDate && (
              <Alert style={{ background: "var(--primary-light)", borderColor: "var(--primary-ss)" }}>
                <AlertDescription style={{ color: "var(--primary-ss)" }}>
                  Revisions expire 60 days after delivery (
                  {new Date(new Date(selectedOrder.deliveryDate).getTime() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString()})
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!selectedOrder && !isLoading && (
        <Card style={{ background: "var(--white)", borderColor: "var(--border-ss)" }} className="border">
          <CardContent className="pt-8 pb-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" style={{ color: "var(--ink-3)" }} />
            <p style={{ color: "var(--ink-3)" }}>Search for an order to request revisions</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
