import api from "@/lib/api";

export type OrderStatus = 'PENDING' | 'PICKED_UP' | 'IN_CLEANING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  id?: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface TimeSlot {
  date: string;
  time: string;
}

export interface Order {
  id: string;
  customerId: string;
  status: OrderStatus;
  serviceType: 'STANDARD' | 'PREMIUM';
  weight?: number; // Kg for STANDARD
  items: OrderItem[]; // for PREMIUM
  isExpress: boolean;
  isDryClean: boolean;
  totalPrice: number;
  pickupSlot?: TimeSlot;
  deliverySlot?: TimeSlot;
  createdAt: string;
  updatedAt?: string;
}

const unwrap = (res: any) => res.data?.data ?? res.data;

class OrderService {
  async calculatePrice(
    serviceType: 'STANDARD' | 'PREMIUM',
    options: { weight?: number; items?: Omit<OrderItem, 'id'>[]; isExpress: boolean; isDryClean: boolean },
    rules: Record<string, number>
  ): Promise<number> {
    const stdPerKg = rules["STANDARD_PER_KILO"] ?? 12.50;
    const dryCleanFee = rules["DRY_CLEAN_FEE"] ?? 15.00;
    const expressMult = rules["EXPRESS_MULTIPLIER"] ?? 1.5;

    let basePrice = 0;
    if (serviceType === 'STANDARD') {
      basePrice = (options.weight || 0) * stdPerKg;
    } else {
      basePrice = (options.items || []).reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    }
    
    if (options.isDryClean) basePrice += dryCleanFee;
    if (options.isExpress) basePrice *= expressMult;

    return Number(basePrice.toFixed(2));
  }

  async createOrder(
    customerId: string, 
    serviceType: 'STANDARD' | 'PREMIUM',
    options: { weight?: number; items?: Omit<OrderItem, 'id'>[]; isExpress: boolean; isDryClean: boolean; pickupSlot?: TimeSlot; deliverySlot?: TimeSlot; totalPrice: number }
  ): Promise<Order> {
    const payload = {
      customerId,
      serviceType,
      weight: options.weight,
      items: options.items,
      isExpress: options.isExpress,
      isDryClean: options.isDryClean,
      pickupSlot: options.pickupSlot,
      deliverySlot: options.deliverySlot,
      totalPrice: options.totalPrice
    };

    const res = await api.post("/api/orders", payload);
    return unwrap(res);
  }

  async getOrderById(orderId: string | number): Promise<Order | null> {
    const res = await api.get(`/api/orders/${orderId}`);
    return unwrap(res);
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    const res = await api.get(`/api/orders/customer/${customerId}`);
    return unwrap(res);
  }

  async getAllOrders(): Promise<Order[]> {
    const res = await api.get("/api/orders");
    return unwrap(res);
  }

  async assignPickupSlot(orderId: string | number, timeSlot: TimeSlot): Promise<Order> {
    const order = await this.getOrderById(orderId);
    if (!order) throw new Error("Order not found");
    // Use PUT internally (simulated via patch or full update if needed)
    // For simplicity, we assume we just do a full update since our backend expects the whole object
    const updatePayload = { ...order, pickupSlot: timeSlot };
    const res = await api.put(`/api/orders/${orderId}`, updatePayload);
    return unwrap(res);
  }

  async assignDeliverySlot(orderId: string | number, timeSlot: TimeSlot): Promise<Order> {
    const order = await this.getOrderById(orderId);
    if (!order) throw new Error("Order not found");
    const updatePayload = { ...order, deliverySlot: timeSlot };
    const res = await api.put(`/api/orders/${orderId}`, updatePayload);
    return unwrap(res);
  }

  async updateOrderStatus(orderId: string | number, status: OrderStatus): Promise<Order> {
    const res = await api.patch(`/api/orders/${orderId}/status`, { status });
    return unwrap(res);
  }

  async cancelOrder(orderId: string | number): Promise<Order> {
    const res = await api.patch(`/api/orders/${orderId}/status`, { status: 'CANCELLED' });
    return unwrap(res);
  }

  // Lifecycle helpers
  async markPickedUp(orderId: string | number) { return this.updateOrderStatus(orderId, 'PICKED_UP'); }
  async markInCleaning(orderId: string | number) { return this.updateOrderStatus(orderId, 'IN_CLEANING'); }
  async markOutForDelivery(orderId: string | number) { return this.updateOrderStatus(orderId, 'OUT_FOR_DELIVERY'); }
  async markDelivered(orderId: string | number) { return this.updateOrderStatus(orderId, 'DELIVERED'); }

  // Pricing configuration
  async getPricingRules(): Promise<Record<string, number>> {
    const res = await api.get("/api/orders/pricing");
    return unwrap(res);
  }

  async updatePricingRules(rules: Record<string, number>): Promise<Record<string, number>> {
    const res = await api.put("/api/orders/pricing", rules);
    return unwrap(res);
  }
}

export const orderService = new OrderService();
