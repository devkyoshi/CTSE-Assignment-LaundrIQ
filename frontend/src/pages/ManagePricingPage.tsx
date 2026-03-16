import { useEffect, useState } from "react";
import { pricingService } from "@/services/pricingService";
import type { PriceCatalogue } from "@/types";
import { SERVICE_TYPES, ITEM_TYPES } from "@/types";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatCurrency, formatServiceType } from "@/lib/helpers";
import { Plus, Trash2 } from "lucide-react";

export default function ManagePricingPage() {
  const [entries, setEntries] = useState<PriceCatalogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceType, setServiceType] = useState("");
  const [itemType, setItemType] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadEntries = () => {
    pricingService.getAll()
      .then(setEntries)
      .catch(() => toast.error("Failed to load pricing"))
      .finally(() => setLoading(false));
  };

  useEffect(loadEntries, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceType || !itemType || !unitPrice) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    try {
      await pricingService.create({ serviceType, itemType, unitPrice: Number(unitPrice), currency: "USD" });
      toast.success("Price entry created");
      setServiceType(""); setItemType(""); setUnitPrice("");
      loadEntries();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create entry");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await pricingService.delete(id);
      toast.success("Price entry deleted");
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      toast.error("Failed to delete entry");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Manage Pricing</h1>

        <Card>
          <CardHeader><CardTitle className="text-xl">Add New Price Entry</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="space-y-2 flex-1">
                <Label>Service Type</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((s) => <SelectItem key={s} value={s}>{formatServiceType(s)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex-1">
                <Label>Item Type</Label>
                <Select value={itemType} onValueChange={setItemType}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.map((i) => <SelectItem key={i} value={i}>{i.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 w-32">
                <Label>Unit Price</Label>
                <Input type="number" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="0.00" />
              </div>
              <Button type="submit" disabled={submitting}><Plus className="mr-1 h-4 w-4" />Add</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-xl">Current Pricing</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((e) => (
                      <TableRow key={e.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="tabular-nums">{e.id}</TableCell>
                        <TableCell>{formatServiceType(e.serviceType)}</TableCell>
                        <TableCell>{e.itemType.replace("_", " ")}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(e.unitPrice)}</TableCell>
                        <TableCell className="text-muted-foreground">{e.currency}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
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
