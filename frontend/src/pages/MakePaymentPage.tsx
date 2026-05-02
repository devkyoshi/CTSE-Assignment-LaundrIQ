import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { paymentService } from "@/services/paymentService";
import { orderService, Order } from "@/services/orderService";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/helpers";
import type { Payment } from "@/types";

const PAYMENT_METHODS = ["CREDIT_CARD", "DEBIT_CARD", "CASH_ON_DELIVERY"];

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      color: "#1a1a2e",
      "::placeholder": { color: "#a0aec0" },
    },
    invalid: { color: "#e53e3e" },
  },
};

function CheckoutForm({ order, orderId, payment }: { order: Order; orderId: string; payment: Payment }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const parsedOrderId = Number(orderId);
  const paymentMethod = payment.paymentMethod || "CREDIT_CARD";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error("You must be logged in");
      return;
    }

    setSubmitting(true);
    try {
      if (!Number.isFinite(parsedOrderId) || parsedOrderId <= 0) {
        toast.error("Invalid order ID for payment");
        return;
      }

      let currentPayment = payment;
      if (paymentMethod !== "CASH_ON_DELIVERY" && !currentPayment.stripeClientSecret) {
        currentPayment = await paymentService.createPayment({
          orderId: parsedOrderId,
          paymentMethod,
          customerId: user.id,
        });
      }

      // Step 2: For card payments, confirm with Stripe
      if (paymentMethod !== "CASH_ON_DELIVERY") {
        if (!stripe || !elements) {
          toast.error("Stripe is not loaded yet");
          setSubmitting(false);
          return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement || !currentPayment.stripeClientSecret) {
          toast.error("Card details are required");
          setSubmitting(false);
          return;
        }

        const { error, paymentIntent } = await stripe.confirmCardPayment(
          currentPayment.stripeClientSecret,
          { payment_method: { card: cardElement } }
        );

        if (error) {
          toast.error(error.message || "Payment failed");
          setSubmitting(false);
          return;
        }

        // Step 3: Confirm on our backend
        if (paymentIntent) {
          const confirmed = await paymentService.confirmPayment({
            paymentIntentId: paymentIntent.id,
          });

          if (confirmed.status === "COMPLETED") {
            toast.success("Payment completed successfully");
            navigate(`/payments/${confirmed.id}`);
          } else {
            toast.error("Payment failed. Please try again.");
          }
        }
      } else {
        // Cash on delivery - payment stays PENDING
        toast.success("Order confirmed for cash on delivery");
        navigate(`/payments/${currentPayment.id}`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Failed to process payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted p-4 rounded-md space-y-1">
        <p className="text-sm text-muted-foreground">Paying for Order ID</p>
        <p className="font-mono text-sm">{orderId}</p>
        <p className="text-sm text-muted-foreground mt-2">Amount Due</p>
        <p className="text-2xl font-bold tabular-nums text-primary">
          {formatCurrency(order.totalPrice)}
        </p>
      </div>

      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <Label>Payment Method</Label>
          <Select value={paymentMethod} disabled>
            <SelectTrigger>
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {paymentMethod !== "CASH_ON_DELIVERY" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <Label>Card Details</Label>
            <div className="border rounded-md p-3 bg-background">
              <CardElement options={CARD_ELEMENT_OPTIONS} />
            </div>
            <p className="text-xs text-muted-foreground">
              Use test card 4242 4242 4242 4242, any future expiry, any CVC.
            </p>
          </div>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={submitting || (!stripe && paymentMethod !== "CASH_ON_DELIVERY")}
      >
        {submitting
          ? "Processing Securely..."
          : `Pay ${formatCurrency(order.totalPrice)}`}
      </Button>
    </form>
  );
}

export default function MakePaymentPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const paymentId = searchParams.get("paymentId") || "";
  const parsedOrderId = Number(orderId);
  const parsedPaymentId = Number(paymentId);
  const hasValidOrderId = Number.isFinite(parsedOrderId) && parsedOrderId > 0;
  const hasValidPaymentId = Number.isFinite(parsedPaymentId) && parsedPaymentId > 0;

  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasValidOrderId) {
      toast.error("Invalid order ID");
      setLoading(false);
      return;
    }
    setLoading(true);
    const loadOrder = orderService.getOrderById(parsedOrderId);
    const loadPayment = hasValidPaymentId
      ? paymentService.getById(parsedPaymentId)
      : paymentService.getByOrder(parsedOrderId);

    Promise.all([loadOrder, loadPayment])
      .then(([orderData, paymentData]) => {
        setOrder(orderData);
        setPayment(paymentData);
      })
      .catch(() => toast.error("Failed to fetch order or payment details"))
      .finally(() => setLoading(false));
  }, [hasValidOrderId, hasValidPaymentId, parsedOrderId, parsedPaymentId]);

  if (loading)
    return (
      <div className="space-y-4 max-w-xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );

  if (!order || !payment)
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order or payment not found</p>
      </div>
    );

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Checkout</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Payment Details</CardTitle>
          <CardDescription>
            Select a payment method and complete your order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Elements stripe={stripePromise}>
            <CheckoutForm order={order} orderId={orderId} payment={payment} />
          </Elements>
        </CardContent>
      </Card>
    </div>
  );
}
