import { useEffect, useState } from "react";
import { pricingService } from "@/services/pricingService";
import type { PriceCatalogue } from "@/types";
import { SERVICE_TYPES } from "@/types";
import AppLayout from "@/components/AppLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatCurrency, formatServiceType } from "@/lib/helpers";

export default function PricingPage() {
  const [entries, setEntries] = useState<PriceCatalogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    const serviceType = filter === "ALL" ? undefined : filter;
    setLoading(true);
    pricingService.getAll(serviceType)
      .then(setEntries)
      .catch(() => toast.error("Failed to load pricing"))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Pricing Catalogue</h1>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <CardTitle className="text-xl flex-1">Price List</CardTitle>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Services</SelectItem>
                  {SERVICE_TYPES.map((s) => (
                    <SelectItem key={s} value={s}>{formatServiceType(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Item Type</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead>Currency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((e) => (
                      <TableRow key={e.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{formatServiceType(e.serviceType)}</TableCell>
                        <TableCell>{e.itemType.replace("_", " ")}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(e.unitPrice)}</TableCell>
                        <TableCell className="text-muted-foreground">{e.currency}</TableCell>
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
