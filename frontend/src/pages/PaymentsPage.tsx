import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { mockPaymentService, Payment } from "@/services/mockPaymentService";
import { orderService } from "@/services/orderService";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard } from "lucide-react";
import { getPaymentStatusVariant, formatCurrency, formatDate } from "@/lib/helpers";
import { toast } from "sonner";

export default function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    
    // Fetch user's orders to filter payments
    orderService.getOrdersByCustomer(user.id).then(orders => {
      const orderIds = new Set(orders.map(o => o.id));
      return mockPaymentService.getAllPayments().then(allPay => {
        return allPay.filter(p => orderIds.has(p.orderId));
      });
    })
    .then(userPayments => setPayments(userPayments.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())))
    .catch(() => toast.error("Failed to load payments"))
    .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">My Payments</h1>
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-2 text-sm font-medium text-foreground">No payments yet</p>
              <p className="text-sm text-muted-foreground">When you make payments, they will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <Link to={`/payments/${p.id}`} className="text-primary hover:underline font-medium tabular-nums">{p.id}</Link>
                      </TableCell>
                      <TableCell>
                        <Link to={`/orders/${p.orderId}`} className="text-primary hover:underline tabular-nums">{p.orderId}</Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(p.amount)}</TableCell>
                      <TableCell className="text-sm">{p.details?.method?.replace("_", " ") || "—"}</TableCell>
                      <TableCell><Badge variant={getPaymentStatusVariant(p.status as any)}>{p.status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
