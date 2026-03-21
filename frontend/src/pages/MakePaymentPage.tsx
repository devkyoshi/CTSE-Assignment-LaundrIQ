import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { mockPaymentService } from "@/services/mockPaymentService";
import { mockOrderService, Order } from "@/services/mockOrderService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/helpers";

const PAYMENT_METHODS = ['CREDIT_CARD', 'DEBIT_CARD', 'CASH_ON_DELIVERY'];

export default function MakePaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId") || "";
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [paymentMethod, setPaymentMethod] = useState("CREDIT_CARD");
  const [cardNumber, setCardNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    mockOrderService.getOrderById(orderId)
      .then(setOrder)
      .catch(() => toast.error("Failed to fetch order details"))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !paymentMethod) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    try {
      if (!order) throw new Error("Order not found");
      
      const initPay = await mockPaymentService.initiatePayment(orderId, order.totalPrice);
      
      const details = paymentMethod !== 'CASH_ON_DELIVERY' 
        ? { method: paymentMethod, cardNumberMask: cardNumber.slice(-4) || '0000' }
        : { method: 'CASH_ON_DELIVERY', cardNumberMask: '' };

      const processed = await mockPaymentService.processPayment(initPay.id, details);

      if (processed.status === "COMPLETED" || paymentMethod === 'CASH_ON_DELIVERY') {
        if (order.status === "PENDING") {
           await mockOrderService.updateOrderStatus(orderId, "PICKED_UP"); // mock advancing status
        }
        toast.success("Payment submitted successfully");
        navigate(`/payments/${processed.id}`);
      } else {
        toast.error("Payment failed. Please try again.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to process payment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="space-y-4 max-w-xl"><Skeleton className="h-8 w-48"/><Skeleton className="h-64 w-full"/></div>;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Checkout</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Payment Details</CardTitle>
          <CardDescription>Select a payment method and complete your order.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-muted p-4 rounded-md space-y-1">
               <p className="text-sm text-muted-foreground">Paying for Order ID</p>
               <p className="font-mono text-sm">{orderId}</p>
               <p className="text-sm text-muted-foreground mt-2">Amount Due</p>
               <p className="text-2xl font-bold tabular-nums text-primary">{formatCurrency(order?.totalPrice || 0)}</p>
            </div>
            
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>{m.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {paymentMethod !== 'CASH_ON_DELIVERY' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label>Card Number (Simulated)</Label>
                  <Input 
                    value={cardNumber} 
                    onChange={e => setCardNumber(e.target.value)} 
                    placeholder="4242 4242 4242 4242" 
                    maxLength={19}
                    required={paymentMethod !== 'CASH_ON_DELIVERY'}
                  />
                  <p className="text-xs text-muted-foreground">Use any 16-digit number. The mock gateway has a 95% chance of success.</p>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={submitting || !order}>
              {submitting ? "Processing Securely..." : `Pay ${formatCurrency(order?.totalPrice || 0)}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
