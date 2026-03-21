export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface PaymentDetails {
  paymentId: string;
  cardNumberMask: string;
  method: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  details?: PaymentDetails;
  createdAt: string;
}

export interface Refund {
  id: string;
  paymentId: string;
  status: 'INITIATED' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

class MockPaymentService {
  private getStorage<T>(key: string, defaultValue: T): T {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  }

  private setStorage<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async initiatePayment(orderId: string, amount: number): Promise<Payment> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const payments = this.getStorage<Payment[]>('mock_payments', []);
    
    const newPayment: Payment = {
      id: "PAY-" + Math.floor(10000 + Math.random() * 90000).toString(),
      orderId,
      amount,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    
    this.setStorage('mock_payments', [...payments, newPayment]);
    return newPayment;
  }

  async processPayment(paymentId: string, methodDetails: Omit<PaymentDetails, 'paymentId'>): Promise<Payment> {
    await new Promise(resolve => setTimeout(resolve, 1500)); // simulate external gateway
    const payments = this.getStorage<Payment[]>('mock_payments', []);
    const index = payments.findIndex(p => p.id === paymentId);
    if (index === -1) throw new Error("Payment not found");
    
    // 95% chance of success for mock
    const isSuccess = Math.random() > 0.05;
    
    const updated: Payment = { 
      ...payments[index], 
      status: isSuccess ? 'COMPLETED' : 'FAILED',
      details: {
        ...methodDetails,
        paymentId
      }
    };
    
    payments[index] = updated;
    this.setStorage('mock_payments', payments);
    return updated;
  }

  async getPaymentByOrder(orderId: string): Promise<Payment | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const payments = this.getStorage<Payment[]>('mock_payments', []);
    return payments.find(p => p.orderId === orderId) || null;
  }

  async getPaymentById(paymentId: string): Promise<Payment | null> {
    const payments = this.getStorage<Payment[]>('mock_payments', []);
    return payments.find(p => p.id === paymentId) || null;
  }

  async getAllPayments(): Promise<Payment[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.getStorage<Payment[]>('mock_payments', []);
  }

  async updatePaymentStatus(paymentId: string, status: PaymentStatus): Promise<Payment> {
    const payments = this.getStorage<Payment[]>('mock_payments', []);
    const index = payments.findIndex(p => p.id === paymentId);
    if (index === -1) throw new Error("Payment not found");
    
    payments[index] = { ...payments[index], status };
    this.setStorage('mock_payments', payments);
    return payments[index];
  }

  // Refunds
  async initiateRefund(paymentId: string): Promise<Refund> {
    await new Promise(resolve => setTimeout(resolve, 600));
    const refunds = this.getStorage<Refund[]>('mock_refunds', []);
    const newRefund: Refund = {
      id: "REF-" + Math.floor(1000 + Math.random() * 9000).toString(),
      paymentId: paymentId,
      status: 'INITIATED',
      createdAt: new Date().toISOString()
    };
    this.setStorage('mock_refunds', [...refunds, newRefund]);
    return newRefund;
  }

  async getRefundStatus(refundId: string): Promise<Refund | null> {
    const refunds = this.getStorage<Refund[]>('mock_refunds', []);
    return refunds.find(r => r.id === refundId) || null;
  }
}

export const mockPaymentService = new MockPaymentService();
