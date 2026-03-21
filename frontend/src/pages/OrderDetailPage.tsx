import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { orderService, Order } from "@/services/orderService";
import { ORDER_STATUSES, CANCELLED_STATUS } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { getOrderStatusVariant, formatCurrency, formatDate } from "@/lib/helpers";
import { toast } from "sonner";
import { ArrowLeft, CreditCard, Trash2, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_PROGRESS = ['PENDING', 'PICKED_UP', 'IN_CLEANING', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    orderService.getOrderById(id)
      .then(setOrder)
      .catch(() => toast.error("Failed to load order"))
      .finally(() => setLoading(false));
  }, [id]);

  const advanceStatus = async () => {
    if (!order) return;
    const currentIdx = STATUS_PROGRESS.indexOf(order.status);
    if (currentIdx === -1 || currentIdx === STATUS_PROGRESS.length - 1) return;
    
    const nextStatus = STATUS_PROGRESS[currentIdx + 1];
    setUpdating(true);
    try {
      const updated = await orderService.updateOrderStatus(order.id, nextStatus as any);
      setOrder(updated);
      toast.success(`Status updated to ${nextStatus.replace("_", " ")}`);
    } catch { 
      toast.error("Failed to update status"); 
    } finally { 
      setUpdating(false); 
    }
  };

  const cancelOrder = async () => {
    if (!order) return;
    setUpdating(true);
    try {
      const updated = await orderService.cancelOrder(order.id);
      setOrder(updated);
      toast.success("Order cancelled");
    } catch { 
      toast.error("Failed to cancel order"); 
    } finally { 
      setUpdating(false); 
    }
  };

  const deleteOrder = async () => {
    if (!order) return;
    try {
      // Mock deletion
      const ordersStr = localStorage.getItem("mock_orders") || "[]";
      let ordersList = JSON.parse(ordersStr);
      ordersList = ordersList.filter((o: any) => o.id !== order.id);
      localStorage.setItem("mock_orders", JSON.stringify(ordersList));
      
      toast.success("Order deleted");
      navigate("/orders");
    } catch { 
      toast.error("Failed to delete order"); 
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order not found</p>
        <Button variant="ghost" asChild className="mt-2"><Link to="/orders">Back to Orders</Link></Button>
      </div>
    );
  }

  const currentIdx = STATUS_PROGRESS.indexOf(order.status);
  const isCancelled = order.status === CANCELLED_STATUS;
  const isDelivered = order.status === "DELIVERED";
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 border-b pb-4">
        <Button variant="ghost" size="icon" asChild><Link to="/orders"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Order #{order.id} 
            <Badge variant={getOrderStatusVariant(order.status)} className="text-sm px-3 py-1 uppercase">{order.status}</Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Placed on {formatDate(order.createdAt)}</p>
        </div>
      </div>

      {/* Status tracker */}
      {!isCancelled && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
              {STATUS_PROGRESS.map((status, idx) => {
                const done = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                return (
                  <div key={status} className="flex flex-row sm:flex-col items-center flex-1 w-full sm:w-auto last:flex-none relative">
                    <div className="flex items-center w-full sm:w-auto">
                      <div className={cn(
                        "h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center text-sm font-bold transition-all z-10 shrink-0 shadow-sm",
                        done ? "bg-primary text-primary-foreground scale-110" : "bg-background border-2 border-muted text-muted-foreground"
                      )}>
                        {done ? <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" /> : idx + 1}
                      </div>

                      {/* Mobile connector */}
                      {idx < STATUS_PROGRESS.length - 1 && (
                        <div className={cn(
                          "flex-1 h-1 mx-4 sm:hidden", 
                          done && idx < currentIdx ? "bg-primary" : "bg-muted"
                        )} />
                      )}
                    </div>

                    <span className={cn(
                      "text-xs sm:text-sm mt-0 sm:mt-3 ml-4 sm:ml-0 font-medium whitespace-nowrap text-left sm:text-center flex-1 sm:flex-none",
                      isCurrent ? "text-primary font-bold" : done ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {status.replace(/_/g, " ")}
                    </span>
                  </div>
                );
              })}
              
              {/* Desktop connector overlay */}
              <div className="hidden sm:block absolute left-[15%] right-[15%] top-[2.2rem] h-1 bg-muted -z-0">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-in-out" 
                  style={{ width: `${(currentIdx / (STATUS_PROGRESS.length - 1)) * 100}%` }}
                />
              </div>
            </div>
            
            {!isDelivered && isAdmin && (
              <div className="mt-8 flex justify-center sm:justify-end">
                 {currentIdx < STATUS_PROGRESS.length - 1 && (
                  <Button onClick={advanceStatus} disabled={updating}>
                    Advance Status to {STATUS_PROGRESS[currentIdx + 1].replace(/_/g, " ")}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isCancelled && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6 text-center">
            <h3 className="text-xl font-bold text-destructive flex items-center justify-center gap-2">
              <span className="h-2 w-2 rounded-full bg-destructive" /> Order Cancelled
            </h3>
            <p className="text-sm text-muted-foreground mt-2">This order was cancelled and no further action can be taken.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="overflow-hidden border-border select-none">
            <CardHeader className="bg-slate-50 border-b border-border py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {order.serviceType === 'STANDARD' ? (
                  <div className="flex justify-between items-center p-6 bg-white">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground text-lg">Standard Laundry</span>
                      <span className="text-sm text-muted-foreground mt-1">Weight: {order.weight || 0} Kg @ $12.50/kg</span>
                    </div>
                    <span className="font-semibold tabular-nums text-foreground">{formatCurrency((order.weight || 0) * 12.50)}</span>
                  </div>
                ) : (
                  order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-6 bg-white">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground text-lg">{item.name}</span>
                        <span className="text-sm text-muted-foreground mt-1">Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</span>
                      </div>
                      <span className="font-semibold tabular-nums text-foreground">{formatCurrency(item.quantity * item.unitPrice)}</span>
                    </div>
                  ))
                )}
                
                {/* Add-ons line items */}
                {(order.isExpress || order.isDryClean) && (
                  <div className="p-6 bg-slate-50/50 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Add-ons Selected</h4>
                    {order.isDryClean && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">Dry Cleaning</span>
                        <span className="text-sm font-semibold tabular-nums text-foreground">+$15.00</span>
                      </div>
                    )}
                    {order.isExpress && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">Express Delivery (+50%)</span>
                        <span className="text-sm font-semibold tabular-nums text-foreground">Surcharge Applied</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="bg-slate-50 p-6 flex justify-between items-end border-t border-border">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Amount</span>
                  <span className="font-semibold text-muted-foreground text-sm">Includes all services and taxes</span>
                </div>
                <span className="text-4xl font-bold tabular-nums text-foreground tracking-tight">{formatCurrency(order.totalPrice)}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardContent className="p-6">
              {!isCancelled && order.status !== "PENDING" && (
                 <Button className="w-full text-base h-14 rounded-xl flex items-center justify-center gap-2" asChild>
                   <Link to={`/payments/create?orderId=${order.id}&amount=${order.totalPrice}`}>
                     <CreditCard className="h-5 w-5" /> Proceed to Payment
                   </Link>
                 </Button>
              )}
              
              {!isCancelled && !isDelivered && (
                 <Button variant="outline" className="w-full text-base h-14 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center justify-center gap-2 mt-4 border-destructive/20" onClick={cancelOrder} disabled={updating}>
                   <Trash2 className="h-5 w-5" /> Cancel Order
                 </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-border">
            <CardHeader className="bg-slate-50 border-b border-border py-4">
              <CardTitle className="text-lg">Service Info</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground block mb-2">Service Type</span>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary px-3 py-1 text-sm">{order.serviceType.replace("_", " ")}</Badge>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground block mb-1">Customer Ref</span>
                <p className="font-mono text-sm text-foreground bg-slate-100 p-2 rounded-md inline-block">{order.customerId.slice(0,12)}...</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border overflow-hidden">
             <CardHeader className="bg-slate-50 border-b border-border py-4">
              <CardTitle className="text-lg">Scheduling</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {order.pickupSlot && (
                  <div className="p-6 hover:bg-slate-50 transition-colors">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-600"></span>Pickup</span>
                    <p className="font-medium text-foreground text-lg">{order.pickupSlot.date}</p>
                    <p className="text-muted-foreground">{order.pickupSlot.time}</p>
                  </div>
                )}
                
                {order.deliverySlot && (
                  <div className="p-6 hover:bg-slate-50 transition-colors">
                    <span className="text-xs font-bold text-green-600 uppercase tracking-widest block mb-1 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-600"></span>Delivery</span>
                    <p className="font-medium text-foreground text-lg">{order.deliverySlot.date}</p>
                    <p className="text-muted-foreground">{order.deliverySlot.time}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
