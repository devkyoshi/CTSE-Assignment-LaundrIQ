import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { mockOrderService, Order } from "@/services/mockOrderService";
import { mockPaymentService, Payment } from "@/services/mockPaymentService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Clock, CreditCard, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { getOrderStatusVariant, formatCurrency, formatDate } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    
    // Check if user is an admin
    const isAdmin = user.roles.includes("ROLE_ADMIN");

    const fetchDashboardData = async () => {
      try {
        let orderData = [];
        let paymentsData = [];

        if (isAdmin) {
          orderData = await mockOrderService.getAllOrders();
          paymentsData = await mockPaymentService.getAllPayments();
        } else {
          orderData = await mockOrderService.getOrdersByCustomer(user.id);
          const orderIds = new Set(orderData.map(o => o.id));
          const allPayments = await mockPaymentService.getAllPayments();
          paymentsData = allPayments.filter(p => orderIds.has(p.orderId));
        }

        setOrders(orderData || []);
        setPayments(paymentsData || []);
      } catch (e) {
        setOrders([]);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

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
    <div className="space-y-10 max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {user?.roles.includes("ROLE_ADMIN") ? "Admin Dashboard" : "My Dashboard"}
        </h1>
        <p className="text-base text-muted-foreground mt-2">Welcome back, {user?.username || "Guest"}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={itemVariants}>
              <Card className="hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-y-0">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <div className={cn("p-2.5 rounded-full bg-slate-100 dark:bg-slate-800", stat.color)}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <p className="text-4xl font-semibold tabular-nums text-foreground">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-4">Recent Orders</h2>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-6">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <h3 className="text-lg font-medium text-foreground">No orders yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">You haven't placed any laundry orders. Create your first order to get started.</p>
                <Button asChild className="mt-6">
                  <Link to="/orders/create">Create New Order</Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                  <TableRow className="hover:bg-transparent border-b-border">
                    <TableHead className="py-4 pl-6">Order ID</TableHead>
                    <TableHead className="py-4">Service</TableHead>
                    <TableHead className="py-4 text-right">Total</TableHead>
                    <TableHead className="py-4">Status</TableHead>
                    <TableHead className="py-4 pr-6">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors border-b-border">
                      <TableCell className="py-4 pl-6">
                        <Link to={`/orders/${order.id}`} className="text-primary hover:text-primary/80 font-semibold tabular-nums transition-colors">{order.id}</Link>
                      </TableCell>
                      <TableCell className="py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                        {order.serviceType.replace("_", " ")}
                      </TableCell>
                      <TableCell className="py-4 text-right tabular-nums font-medium text-foreground">
                        {formatCurrency(order.totalPrice)}
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant={getOrderStatusVariant(order.status)} className="uppercase text-[10px] tracking-wider font-semibold px-2.5 py-1">
                          {order.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 pr-6 text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {/* View All Orders Banner */}
            {recentOrders.length > 0 && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-border flex justify-center">
                <Button variant="link" asChild className="text-muted-foreground hover:text-foreground">
                  <Link to="/orders">View all orders &rarr;</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
