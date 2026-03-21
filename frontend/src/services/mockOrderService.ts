export type OrderStatus = 'PENDING' | 'PICKED_UP' | 'IN_CLEANING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  id: string;
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
  items: OrderItem[];
  serviceType: string;
  totalPrice: number;
  pickupSlot?: TimeSlot;
  deliverySlot?: TimeSlot;
  createdAt: string;
  updatedAt: string;
}

class MockOrderService {
  private getStorage<T>(key: string, defaultValue: T): T {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  }

  private setStorage<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async calculatePrice(items: Omit<OrderItem, 'id'>[], serviceType: string): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 200));
    let basePrice = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    if (serviceType === 'EXPRESS') basePrice *= 1.5;
    return Number(basePrice.toFixed(2));
  }

  async createOrder(customerId: string, items: Omit<OrderItem, 'id'>[], serviceType: string): Promise<Order> {
    await new Promise(resolve => setTimeout(resolve, 600));
    const orders = this.getStorage<Order[]>('mock_orders', []);
    
    const itemsWithIds = items.map(item => ({ ...item, id: Math.random().toString(36).substring(7) }));
    const totalPrice = await this.calculatePrice(items, serviceType);

    const newOrder: Order = {
      id: "ORD-" + Math.floor(1000 + Math.random() * 9000).toString(),
      customerId,
      status: 'PENDING',
      items: itemsWithIds,
      serviceType,
      totalPrice,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.setStorage('mock_orders', [newOrder, ...orders]);
    return newOrder;
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const orders = this.getStorage<Order[]>('mock_orders', []);
    return orders.find(o => o.id === orderId) || null;
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const orders = this.getStorage<Order[]>('mock_orders', []);
    return orders.filter(o => o.customerId === customerId);
  }

  async getAllOrders(): Promise<Order[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return this.getStorage<Order[]>('mock_orders', []);
  }

  async assignPickupSlot(orderId: string, timeSlot: TimeSlot): Promise<Order> {
    return this.updateOrderInternal(orderId, { pickupSlot: timeSlot });
  }

  async assignDeliverySlot(orderId: string, timeSlot: TimeSlot): Promise<Order> {
    return this.updateOrderInternal(orderId, { deliverySlot: timeSlot });
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    return this.updateOrderInternal(orderId, { status });
  }

  async cancelOrder(orderId: string): Promise<Order> {
    return this.updateOrderInternal(orderId, { status: 'CANCELLED' });
  }

  // Lifecycle helpers
  async markPickedUp(orderId: string) { return this.updateOrderStatus(orderId, 'PICKED_UP'); }
  async markInCleaning(orderId: string) { return this.updateOrderStatus(orderId, 'IN_CLEANING'); }
  async markOutForDelivery(orderId: string) { return this.updateOrderStatus(orderId, 'OUT_FOR_DELIVERY'); }
  async markDelivered(orderId: string) { return this.updateOrderStatus(orderId, 'DELIVERED'); }

  private async updateOrderInternal(orderId: string, updates: Partial<Order>): Promise<Order> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const orders = this.getStorage<Order[]>('mock_orders', []);
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) throw new Error("Order not found");
    
    const updated = { 
        ...orders[index], 
        ...updates,
        updatedAt: new Date().toISOString()
    };
    orders[index] = updated;
    this.setStorage('mock_orders', orders);
    return updated;
  }
}

export const mockOrderService = new MockOrderService();
