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
    options: { weight?: number; items?: Omit<OrderItem, 'id'>[]; isExpress: boolean; isDryClean: boolean }
  ): Promise<number> {
    let basePrice = 0;
    if (serviceType === 'STANDARD') {
      basePrice = (options.weight || 0) * 12.50;
    } else {
      basePrice = (options.items || []).reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    }
    
    if (options.isDryClean) basePrice += 15.00;
    if (options.isExpress) basePrice *= 1.5;

    return Number(basePrice.toFixed(2));
  }

  async createOrder(
    customerId: string, 
    serviceType: 'STANDARD' | 'PREMIUM',
    options: { weight?: number; items?: Omit<OrderItem, 'id'>[]; isExpress: boolean; isDryClean: boolean; pickupSlot?: TimeSlot; deliverySlot?: TimeSlot }
  ): Promise<Order> {
    const totalPrice = await this.calculatePrice(serviceType, options);
    
    const payload = {
      customerId,
      serviceType,
      weight: options.weight,
      items: options.items,
      isExpress: options.isExpress,
      isDryClean: options.isDryClean,
      pickupSlot: options.pickupSlot,
      deliverySlot: options.deliverySlot,
      totalPrice
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
}

export const orderService = new OrderService();
