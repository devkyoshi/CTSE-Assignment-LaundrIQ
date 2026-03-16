import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { paymentService } from "@/services/paymentService";
import { PAYMENT_METHODS } from "@/types";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { formatCurrency, formatPaymentMethod } from "@/lib/helpers";

export default function MakePaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState(searchParams.get("orderId") || "");
  const [amount, setAmount] = useState(searchParams.get("amount") || "");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !amount || !paymentMethod) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    try {
      await paymentService.create({
        orderId: Number(orderId),
        amount: Number(amount),
        paymentMethod,
        status: "PENDING",
      });
      toast.success("Payment submitted successfully");
      navigate("/payments");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-xl space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Make Payment</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Payment Details</CardTitle>
            <CardDescription>Select a payment method and submit</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Order ID</Label>
                <Input type="number" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Enter order ID" />
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                {amount && <p className="text-sm text-muted-foreground">{formatCurrency(Number(amount))}</p>}
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>{formatPaymentMethod(m)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Processing..." : "Submit Payment"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
