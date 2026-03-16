import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { orderService } from "@/services/orderService";
import type { Order } from "@/types";
import { ORDER_STATUSES, CANCELLED_STATUS } from "@/types";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { getOrderStatusVariant, getNextOrderStatus, formatCurrency, formatDate } from "@/lib/helpers";
import { toast } from "sonner";
import { ArrowLeft, CreditCard, Trash2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    orderService.getById(Number(id))
      .then(setOrder)
      .catch(() => toast.error("Failed to load order"))
      .finally(() => setLoading(false));
  }, [id]);

  const advanceStatus = async () => {
    if (!order) return;
    const next = getNextOrderStatus(order.status);
    if (!next) return;
    setUpdating(true);
    try {
      const updated = await orderService.updateStatus(order.id, next);
      setOrder(updated);
      toast.success(`Status updated to ${next}`);
    } catch { toast.error("Failed to update status"); }
    finally { setUpdating(false); }
  };

  const cancelOrder = async () => {
    if (!order) return;
    setUpdating(true);
    try {
      const updated = await orderService.updateStatus(order.id, CANCELLED_STATUS);
      setOrder(updated);
      toast.success("Order cancelled");
    } catch { toast.error("Failed to cancel order"); }
    finally { setUpdating(false); }
  };

  const deleteOrder = async () => {
    if (!order) return;
    try {
      await orderService.delete(order.id);
      toast.success("Order deleted");
      navigate("/orders");
    } catch { toast.error("Failed to delete order"); }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-4 max-w-2xl">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Order not found</p>
          <Button variant="ghost" asChild className="mt-2"><Link to="/orders">Back to Orders</Link></Button>
        </div>
      </AppLayout>
    );
  }

  const currentIdx = ORDER_STATUSES.indexOf(order.status as any);
  const isCancelled = order.status === CANCELLED_STATUS;
  const isDelivered = order.status === "DELIVERED";

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link to="/orders"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Order #{order.id}</h1>
            <p className="text-sm text-muted-foreground">Created {formatDate(order.createdAt)}</p>
          </div>
        </div>

        {/* Status tracker */}
        {!isCancelled && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                {ORDER_STATUSES.map((status, idx) => {
                  const done = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  return (
                    <div key={status} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                          done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          {idx + 1}
                        </div>
                        <span className={cn(
                          "text-xs mt-1 font-medium",
                          isCurrent ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {status.replace("_", " ")}
                        </span>
                      </div>
                      {idx < ORDER_STATUSES.length - 1 && (
                        <div className={cn("flex-1 h-0.5 mx-2", done && idx < currentIdx ? "bg-primary" : "bg-muted")} />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {isCancelled && (
          <Card>
            <CardContent className="pt-6 text-center">
              <Badge variant="cancelled" className="text-base px-4 py-1">CANCELLED</Badge>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Customer ID</span><p className="font-mono text-xs mt-0.5">{order.customerId}</p></div>
              <div><span className="text-muted-foreground">Item ID</span><p className="font-medium tabular-nums mt-0.5">{order.itemId}</p></div>
              <div><span className="text-muted-foreground">Quantity</span><p className="font-medium tabular-nums mt-0.5">{order.quantity}</p></div>
              <div><span className="text-muted-foreground">Total Price</span><p className="font-medium tabular-nums mt-0.5">{formatCurrency(order.totalPrice)}</p></div>
              <div><span className="text-muted-foreground">Status</span><div className="mt-0.5"><Badge variant={getOrderStatusVariant(order.status)}>{order.status}</Badge></div></div>
              <div><span className="text-muted-foreground">Created</span><p className="mt-0.5">{formatDate(order.createdAt)}</p></div>
            </div>
          </CardContent>
        </Card>

        {!isCancelled && !isDelivered && (
          <div className="flex flex-wrap gap-3">
            {getNextOrderStatus(order.status) && (
              <Button onClick={advanceStatus} disabled={updating}>
                Advance to {getNextOrderStatus(order.status)?.replace("_", " ")}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link to={`/payments/create?orderId=${order.id}&amount=${order.totalPrice}`}>
                <CreditCard className="mr-2 h-4 w-4" />Make Payment
              </Link>
            </Button>
            <Button variant="destructive" onClick={cancelOrder} disabled={updating}>Cancel Order</Button>
          </div>
        )}

        {isDelivered && (
          <Button variant="outline" asChild>
            <Link to={`/payments/create?orderId=${order.id}&amount=${order.totalPrice}`}>
              <CreditCard className="mr-2 h-4 w-4" />Make Payment
            </Link>
          </Button>
        )}

        <Separator />
        <Button variant="ghost" size="sm" className="text-destructive" onClick={deleteOrder}>
          <Trash2 className="mr-2 h-4 w-4" />Delete Order
        </Button>
      </div>
    </AppLayout>
  );
}
