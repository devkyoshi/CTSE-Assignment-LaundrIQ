import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { paymentService } from "@/services/paymentService";
import type { Payment } from "@/types";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard } from "lucide-react";
import { getPaymentStatusVariant, formatCurrency, formatDate, formatPaymentMethod } from "@/lib/helpers";
import { toast } from "sonner";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentService.getAll()
      .then((data) => setPayments(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load payments"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Payments</h1>
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-2 text-sm font-medium text-foreground">No payments yet</p>
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
                          <Link to={`/payments/${p.id}`} className="text-primary hover:underline font-medium tabular-nums">#{p.id}</Link>
                        </TableCell>
                        <TableCell>
                          <Link to={`/orders/${p.orderId}`} className="text-primary hover:underline tabular-nums">#{p.orderId}</Link>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(p.amount)}</TableCell>
                        <TableCell className="text-sm">{formatPaymentMethod(p.paymentMethod)}</TableCell>
                        <TableCell><Badge variant={getPaymentStatusVariant(p.status)}>{p.status}</Badge></TableCell>
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
    </AppLayout>
  );
}
