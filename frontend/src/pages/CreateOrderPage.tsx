import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { orderService, OrderItem } from "@/services/orderService";
import { mockPaymentService } from "@/services/mockPaymentService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/helpers";
import { cn } from "@/lib/utils";

const SERVICE_TYPES: ('STANDARD' | 'PREMIUM')[] = ['STANDARD', 'PREMIUM'];



export default function CreateOrderPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1: Items & Service
  const [serviceType, setServiceType] = useState<'STANDARD' | 'PREMIUM'>("STANDARD");
  const [weight, setWeight] = useState<number>(3); // 3 kg default for standard
  const [cartItems, setCartItems] = useState<Omit<OrderItem, 'id'>[]>([]);
  const [isExpress, setIsExpress] = useState(false);
  const [isDryClean, setIsDryClean] = useState(false);
  
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);

  // Step 2: Slots
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");

  // Step 3: Payment
  const [cardNumber, setCardNumber] = useState("");
  const [processing, setProcessing] = useState(false);

  const [rules, setRules] = useState<Record<string, number>>({});

  useEffect(() => {
    orderService.getPricingRules().then(setRules).catch(console.error);
  }, []);

  useEffect(() => {
    orderService.calculatePrice(serviceType, {
      weight,
      items: cartItems,
      isExpress,
      isDryClean
    }, rules).then(setCalculatedPrice);
  }, [cartItems, serviceType, weight, isExpress, isDryClean, rules]);

  const premiumCatalogue = Object.entries(rules)
    .filter(([k]) => k.startsWith("PREM_CAT_"))
    .map(([k, v]) => ({ name: k.replace("PREM_CAT_", "").replace(/_/g, " "), price: v }));

  const addToCart = (product: { name: string; price: number }) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.name === product.name);
      if (existing) {
        return prev.map(i => i.name === product.name ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { name: product.name, unitPrice: product.price, quantity: 1 }];
    });
  };

  const removeFromCart = (name: string) => {
    setCartItems(prev => prev.filter(i => i.name !== name));
  };

  const submitOrder = async () => {
    if (!user?.id) return;
    setProcessing(true);
    try {
      // 1. Create order
      const order = await orderService.createOrder(user.id, serviceType, {
        weight,
        items: cartItems,
        isExpress,
        isDryClean,
        totalPrice: calculatedPrice
      });
      
      // 2. Assign slots
      await orderService.assignPickupSlot(order.id, { date: pickupDate, time: pickupTime });
      await orderService.assignDeliverySlot(order.id, { date: deliveryDate, time: deliveryTime });

      // 3. Mock Payment processing
      const initPay = await mockPaymentService.initiatePayment(order.id, calculatedPrice);
      const processed = await mockPaymentService.processPayment(initPay.id, {
        method: "CREDIT_CARD",
        cardNumberMask: cardNumber.slice(-4)
      });

      if (processed.status === "COMPLETED") {
        await orderService.updateOrderStatus(order.id, "PICKED_UP"); // mock advancing status
        toast.success("Order placed and payment successful!");
        navigate(`/orders`);
      } else {
        toast.error("Payment failed. Order saved as pending.");
        navigate(`/orders`);
      }
    } catch (e: any) {
      toast.error("Error creating order");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Place New Order</h1>
          <p className="text-base text-muted-foreground mt-2">Follow the steps below to schedule your laundry</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className={cn("flex items-center justify-center h-8 w-8 rounded-full border-2", step >= 1 ? "border-primary bg-primary text-white" : "border-muted text-muted-foreground")}>1</span>
          <span className={cn("h-1 w-8 rounded-full", step >= 2 ? "bg-primary" : "bg-muted")} />
          <span className={cn("flex items-center justify-center h-8 w-8 rounded-full border-2", step >= 2 ? "border-primary bg-primary text-white" : "border-muted text-muted-foreground")}>2</span>
          <span className={cn("h-1 w-8 rounded-full", step >= 3 ? "bg-primary" : "bg-muted")} />
          <span className={cn("flex items-center justify-center h-8 w-8 rounded-full border-2", step >= 3 ? "border-primary bg-primary text-white" : "border-muted text-muted-foreground")}>3</span>
        </div>
      </div>

      <Card className="border-border">
        <CardContent className="p-8">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">1. Select Service & Items</h2>
                <Separator />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <div>
                    <Label className="text-base">Service Level</Label>
                    <p className="text-sm text-muted-foreground mt-1">Choose how you want us to price and process your laundry.</p>
                  </div>
                  <Select value={serviceType} onValueChange={(v: 'STANDARD'|'PREMIUM') => setServiceType(v)}>
                    <SelectTrigger className="h-12"><SelectValue placeholder="Select service" /></SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.map(s => <SelectItem key={s} value={s}>{s === 'STANDARD' ? 'Standard Laundry (Per Kg)' : 'Premium Items (Per Item)'}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-base">Global Add-ons</Label>
                    <p className="text-sm text-muted-foreground mt-1">Select any additional services for your entire order.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 border p-3 rounded-lg bg-slate-50 border-border cursor-pointer hover:bg-slate-100 transition-colors">
                      <Checkbox id="express" checked={isExpress} onCheckedChange={(checked) => setIsExpress(checked as boolean)} />
                      <Label htmlFor="express" className="cursor-pointer font-medium text-sm">Express (+{((rules["EXPRESS_MULTIPLIER"] ?? 1.5) - 1) * 100}%)</Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-lg bg-slate-50 border-border cursor-pointer hover:bg-slate-100 transition-colors">
                      <Checkbox id="dryclean" checked={isDryClean} onCheckedChange={(checked) => setIsDryClean(checked as boolean)} />
                      <Label htmlFor="dryclean" className="cursor-pointer font-medium text-sm">Dry Clean (+{formatCurrency(rules["DRY_CLEAN_FEE"] ?? 15.00)})</Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-4">
                <div className="space-y-4">
                  {serviceType === 'STANDARD' ? (
                    <div className="p-6 bg-slate-50 rounded-xl border border-border space-y-4">
                      <Label className="text-base block">Estimated Weight (Kg)</Label>
                      <div className="flex items-center gap-4">
                        <Input type="number" min="1" max="50" className="h-14 text-2xl font-bold w-32 px-4 shadow-sm" value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
                        <span className="text-muted-foreground font-medium">kg @ {formatCurrency(rules["STANDARD_PER_KILO"] ?? 12.50)}/kg</span>
                      </div>
                      <p className="text-sm text-muted-foreground">This is an estimate. Final weight is subject to measurement upon pickup.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Label className="text-base">Premium Catalogue</Label>
                      <div className="grid gap-3">
                        {premiumCatalogue.length === 0 ? <p className="text-sm text-muted-foreground">No premium items configured.</p> : null}
                        {premiumCatalogue.map(c => (
                          <div key={c.name} className="flex items-center justify-between p-4 border border-border rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                            <div>
                              <p className="font-semibold text-foreground">{c.name}</p>
                              <p className="text-sm text-primary font-medium">{formatCurrency(c.price)}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => addToCart(c)} className="rounded-full px-6">Add to Cart</Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4 lg:border-l lg:pl-10">
                  <Label className="text-base">Order Summary</Label>
                  <div className="min-h-[200px] flex flex-col pt-2">
                    {serviceType === 'STANDARD' ? (
                      <div className="flex-1 space-y-3">
                        <div className="flex justify-between items-center p-4 rounded-xl bg-white border border-border shadow-sm">
                          <span className="font-medium">Standard Laundry <span className="text-muted-foreground ml-2">({weight} Kg)</span></span>
                          <span className="font-medium tabular-nums">{formatCurrency(weight * (rules["STANDARD_PER_KILO"] ?? 12.50))}</span>
                        </div>
                      </div>
                    ) : (
                      cartItems.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-xl border border-dashed border-border/60">
                          <p className="text-muted-foreground">Cart is empty.<br/>Add items from the catalogue.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 flex-1">
                          {cartItems.map(c => (
                            <div key={c.name} className="flex justify-between items-center p-3 rounded-xl bg-white border border-border shadow-sm">
                              <span className="font-medium text-sm"><span className="text-primary mr-2 font-bold">{c.quantity}x</span>{c.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="font-medium tabular-nums text-sm">{formatCurrency(c.quantity * c.unitPrice)}</span>
                                <Button variant="ghost" size="sm" onClick={() => removeFromCart(c.name)} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 rounded-full">✕</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    )}

                    {(isExpress || isDryClean) && (
                      <div className="mt-4 pt-4 border-t space-y-2">
                        {isDryClean && <div className="flex justify-between text-sm"><span className="text-muted-foreground font-medium flex items-center gap-1"><span className="text-blue-500 rounded-full h-1.5 w-1.5 bg-blue-500 block relative top-px"></span>Dry Cleaning Fee</span><span className="tabular-nums font-medium text-foreground">+{formatCurrency(rules["DRY_CLEAN_FEE"] ?? 15.00)}</span></div>}
                        {isExpress && <div className="flex justify-between text-sm"><span className="text-muted-foreground font-medium flex items-center gap-1"><span className="text-orange-500 rounded-full h-1.5 w-1.5 bg-orange-500 block relative top-px"></span>Express Surcharge</span><span className="tabular-nums font-medium text-foreground">+{((rules["EXPRESS_MULTIPLIER"] ?? 1.5) - 1) * 100}%</span></div>}
                      </div>
                    )}

                    <div className="pt-6 mt-auto">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-border">
                        <span className="font-semibold text-muted-foreground">Subtotal</span>
                        <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{formatCurrency(calculatedPrice)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-8">
                <Button size="lg" className="px-10" onClick={() => setStep(2)} disabled={serviceType === 'PREMIUM' && cartItems.length === 0}>Next Step &rarr;</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">2. Choose Scheduling</h2>
                <Separator />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6 bg-slate-50 p-6 rounded-xl border border-border">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">1</div>
                      Pickup
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-5">Select a convenient date and time for our driver to collect your laundry.</p>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" className="h-12" value={pickupDate} onChange={e => setPickupDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Time Window</Label>
                        <Input type="time" className="h-12" value={pickupTime} onChange={e => setPickupTime(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 bg-slate-50 p-6 rounded-xl border border-border">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">2</div>
                      Delivery
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-5">Choose when you'd like your freshly cleaned items returned to you.</p>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" className="h-12" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Time Window</Label>
                        <Input type="time" className="h-12" value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-8">
                <Button variant="outline" size="lg" onClick={() => setStep(1)}>&larr; Back</Button>
                <Button size="lg" className="px-10" onClick={() => setStep(3)} disabled={!pickupDate || !pickupTime || !deliveryDate || !deliveryTime}>Proceed to Checkout &rarr;</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">3. Payment & Confirmation</h2>
                <Separator />
              </div>

              <div className="max-w-md mx-auto space-y-8 border rounded-2xl p-8 bg-slate-50 shadow-sm mt-4">
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Amount Due</p>
                  <p className="text-5xl font-bold text-foreground tracking-tight">{formatCurrency(calculatedPrice)}</p>
                </div>

                <Separator />

                <div className="space-y-5">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold">Simulated Payment</Label>
                    <p className="text-sm text-muted-foreground">Enter test card numbers to authorize transaction via mock gateway.</p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Card Number</Label>
                    <Input className="h-12 text-lg font-mono tracking-widest placeholder:text-muted-foreground/50 bg-white" placeholder="4242 4242 4242 4242" value={cardNumber} onChange={e => setCardNumber(e.target.value)} maxLength={19} />
                  </div>
                </div>

                <div className="pt-4">
                  <Button size="lg" className="w-full text-base h-14 rounded-xl" onClick={submitOrder} disabled={processing || cardNumber.length < 8}>
                    {processing ? "Authorizing Payment..." : `Pay ${formatCurrency(calculatedPrice)}`}
                  </Button>
                </div>
              </div>

              <div className="flex justify-start">
                <Button variant="ghost" className="text-muted-foreground" onClick={() => setStep(2)} disabled={processing}>&larr; Back to Scheduling</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
