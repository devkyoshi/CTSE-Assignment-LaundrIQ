import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { orderService } from "@/services/orderService";
import { pricingService } from "@/services/pricingService";
import { SERVICE_TYPES, ITEM_TYPES } from "@/types";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { formatCurrency, formatServiceType } from "@/lib/helpers";

export default function CreateOrderPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState("");
  const [itemType, setItemType] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [itemId, setItemId] = useState<number | null>(null);

  // Fetch pricing catalogue to get itemId
  useEffect(() => {
    if (serviceType && itemType) {
      setCalculating(true);
      Promise.all([
        pricingService.calculate(serviceType, itemType, quantity),
        pricingService.getAll(serviceType),
      ])
        .then(([price, catalogue]) => {
          setCalculatedPrice(price);
          const match = catalogue.find((p) => p.serviceType === serviceType && p.itemType === itemType);
          setItemId(match?.id ?? null);
        })
        .catch(() => {
          setCalculatedPrice(null);
          toast.error("Failed to calculate price");
        })
        .finally(() => setCalculating(false));
    }
  }, [serviceType, itemType, quantity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceType || !itemType || !calculatedPrice || !itemId || !user) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    try {
      await orderService.create({
        itemId,
        customerId: user.id,
        quantity,
        totalPrice: calculatedPrice,
        status: "PENDING",
      });
      toast.success("Order created successfully");
      navigate("/orders");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-xl space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Order</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">New Laundry Order</CardTitle>
            <CardDescription>Select service and item type to see pricing</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Service Type</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((s) => (
                      <SelectItem key={s} value={s}>{formatServiceType(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Item Type</Label>
                <Select value={itemType} onValueChange={setItemType}>
                  <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.map((i) => (
                      <SelectItem key={i} value={i}>{i.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" min={1} max={100} value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
              </div>

              {/* Price calculator */}
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Estimated Total</p>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {calculating ? "Calculating..." : calculatedPrice !== null ? formatCurrency(calculatedPrice) : "—"}
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={submitting || !calculatedPrice}>
                {submitting ? "Creating..." : "Create Order"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
