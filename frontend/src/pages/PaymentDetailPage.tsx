import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { paymentService } from "@/services/paymentService";
import type { Payment } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getPaymentStatusVariant, formatCurrency, formatDate, formatPaymentMethod } from "@/lib/helpers";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    paymentService.getById(Number(id))
      .then(setPayment)
      .catch(() => toast.error("Failed to load payment"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="space-y-4 max-w-2xl"><Skeleton className="h-8 w-48" /><Skeleton className="h-48 w-full" /></div>;
  }

  if (!payment) {
    return <div className="text-center py-12"><p className="text-muted-foreground">Payment not found</p></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link to="/payments"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Payment Receipt #{payment.id}</h1>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-xl">Payment Details</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Order ID</span><p className="mt-0.5"><Link to={`/orders/${payment.orderId}`} className="text-primary hover:underline font-medium">{payment.orderId}</Link></p></div>
            <div><span className="text-muted-foreground">Amount</span><p className="font-medium tabular-nums mt-0.5 text-primary text-lg">{formatCurrency(payment.amount)}</p></div>
            <div><span className="text-muted-foreground">Method</span><p className="font-medium mt-0.5">{formatPaymentMethod(payment.paymentMethod)}</p></div>
            <div><span className="text-muted-foreground">Status</span><div className="mt-0.5"><Badge variant={getPaymentStatusVariant(payment.status)}>{payment.status}</Badge></div></div>
            <div><span className="text-muted-foreground">Created</span><p className="mt-0.5">{formatDate(payment.createdAt)}</p></div>
            {payment.stripePaymentIntentId && (
              <div><span className="text-muted-foreground">Reference</span><p className="mt-0.5 font-mono text-xs">{payment.stripePaymentIntentId}</p></div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
