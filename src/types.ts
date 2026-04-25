export type UserRole = 'admin' | 'manager' | 'accountant' | 'sale';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  birthday?: string;
  address?: string;
  debtBalance?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  customerId: string;
  licensePlate: string;
  vin?: string;
  engineNumber?: string;
  mileage?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  priceImport: number;
  priceSale: number;
  stockQuantity: number;
  minStockAlert: number;
  isConsignment: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'repairing' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  code: string;
  customerId: string;
  customerName?: string;
  vehicleId: string;
  vehiclePlate?: string;
  status: OrderStatus;
  totalAmount: number;
  insuranceAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentAmount?: number;
  serviceAmount?: number;
  paymentStatus?: 'paid' | 'unpaid' | 'partial';
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string;
  serviceName: string;
  quantity: number;
  price: number;
}

export interface InventoryLog {
  id: string;
  productId: string;
  type: 'import' | 'export' | 'consignment' | 'adjustment';
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
}
