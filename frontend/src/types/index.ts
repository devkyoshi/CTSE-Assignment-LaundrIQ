export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  roles: string[];
  active: boolean;
  createdAt: string;
}

export interface LoginData {
  token: string;
  tokenType: string;
  userId: string;
  username: string;
  email: string;
  roles: string[];
}

export interface Order {
  id: number;
  itemId: number;
  customerId: string;
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt: string;
}

export interface Payment {
  id: number;
  orderId: number;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export interface PriceCatalogue {
  id: number;
  serviceType: string;
  itemType: string;
  unitPrice: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export const ORDER_STATUSES = ["PENDING", "PICKED_UP", "WASHING", "READY", "DELIVERED"] as const;
export const CANCELLED_STATUS = "CANCELLED";

export const SERVICE_TYPES = ["WASH", "DRY_CLEAN", "IRON", "WASH_AND_FOLD"] as const;
export const ITEM_TYPES = ["SHIRT", "TROUSER", "JACKET", "BED_SHEET"] as const;
export const PAYMENT_METHODS = ["CREDIT_CARD", "DEBIT_CARD", "PAYPAL", "BANK_TRANSFER"] as const;
export const PAYMENT_STATUSES = ["PENDING", "COMPLETED", "FAILED", "REFUNDED"] as const;
