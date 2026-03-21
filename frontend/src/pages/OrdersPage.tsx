import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { orderService, Order } from "@/services/orderService";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, Search, ShoppingCart } from "lucide-react";
import { getOrderStatusVariant, formatCurrency, formatDate } from "@/lib/helpers";
import { toast } from "sonner";

const ORDER_STATUSES = ['PENDING', 'PICKED_UP', 'IN_CLEANING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const CANCELLED_STATUS = 'CANCELLED';

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    orderService.getOrdersByCustomer(user.id)
      .then((data) => setOrders(data))
      .catch(() => toast.error("Failed to load orders"))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = orders.filter((o) => {
    if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
    if (search && !String(o.id).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">My Orders</h1>
        <Button asChild>
          <Link to="/orders/create"><Plus className="mr-2 h-4 w-4" />Create Order</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by Order ID..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="pl-9" 
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {[...ORDER_STATUSES, CANCELLED_STATUS].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-2 text-sm font-medium text-foreground">No orders found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters or create a new order</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <Link to={`/orders/${order.id}`} className="text-primary hover:underline font-medium tabular-nums">{order.id}</Link>
                      </TableCell>
                      <TableCell className="tabular-nums flex flex-col gap-1 text-xs text-muted-foreground">
                        {order.items.slice(0, 2).map((item, idx) => (
                          <span key={idx}>{item.quantity}x {item.name}</span>
                        ))}
                        {order.items.length > 2 && <span>+{order.items.length - 2} more...</span>}
                      </TableCell>
                      <TableCell className="text-sm">{order.serviceType}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">{formatCurrency(order.totalPrice)}</TableCell>
                      <TableCell><Badge variant={getOrderStatusVariant(order.status)}>{order.status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
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
