import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { orderService } from "@/services/orderService";
import { paymentService } from "@/services/paymentService";
import type { Order, Payment } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Clock, CreditCard, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { getOrderStatusVariant, formatCurrency, formatDate } from "@/lib/helpers";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      orderService.getAll().catch(() => []),
      paymentService.getAll().catch(() => []),
    ]).then(([o, p]) => {
      setOrders(Array.isArray(o) ? o : []);
      setPayments(Array.isArray(p) ? p : []);
      setLoading(false);
    });
  }, []);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;
  const completedPayments = payments.filter((p) => p.status === "COMPLETED").length;
  const recentOrders = orders.slice(0, 5);

  const stats = [
    { label: "Total Orders", value: totalOrders, icon: ShoppingCart, color: "text-primary" },
    { label: "Pending Orders", value: pendingOrders, icon: Clock, color: "text-status-pending-fg" },
    { label: "Completed Payments", value: completedPayments, icon: CreditCard, color: "text-status-success-fg" },
    { label: "Active Orders", value: orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status)).length, icon: Package, color: "text-status-active-fg" },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back, {user?.username}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={itemVariants}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold tabular-nums text-foreground">{stat.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold tracking-tight">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">No orders yet</p>
                <Link to="/orders/create" className="text-sm text-primary hover:underline mt-1 inline-block">Create New Order</Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <Link to={`/orders/${order.id}`} className="text-primary hover:underline font-medium tabular-nums">#{order.id}</Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{order.customerId?.slice(0, 8)}...</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(order.totalPrice)}</TableCell>
                      <TableCell><Badge variant={getOrderStatusVariant(order.status)}>{order.status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
