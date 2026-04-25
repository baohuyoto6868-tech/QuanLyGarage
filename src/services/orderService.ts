import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp, 
  runTransaction,
  limit,
  orderBy,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, OrderItem, Product, Customer, Vehicle, OrderStatus } from '../types';

export const OrderService = {
  // Find customer by phone
  async findCustomerByPhone(phone: string): Promise<Customer | null> {
    const q = query(collection(db, 'customers'), where('phone', '==', phone), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Customer;
  },

  // Find vehicle by license plate
  async findVehicleByPlate(plate: string): Promise<Vehicle | null> {
    const q = query(collection(db, 'vehicles'), where('licensePlate', '==', plate), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Vehicle;
  },

  // Create full order
  async createOrder(
    customerData: Partial<Customer>, 
    vehicleData: Partial<Vehicle>, 
    items: Partial<OrderItem>[],
    orderMeta: Partial<Order>
  ) {
    return await runTransaction(db, async (transaction) => {
      // 1. Handle Customer
      let customerId = customerData.id;
      if (!customerId && customerData.phone) {
        const existing = await this.findCustomerByPhone(customerData.phone);
        if (existing) {
          customerId = existing.id;
        } else {
          const customerRef = doc(collection(db, 'customers'));
          customerId = customerRef.id;
          transaction.set(customerRef, {
            ...customerData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }

      // 2. Handle Vehicle
      let vehicleId = vehicleData.id;
      if (!vehicleId && vehicleData.licensePlate) {
        const existing = await this.findVehicleByPlate(vehicleData.licensePlate);
        if (existing) {
          vehicleId = existing.id;
        } else {
          const vehicleRef = doc(collection(db, 'vehicles'));
          vehicleId = vehicleRef.id;
          transaction.set(vehicleRef, {
            ...vehicleData,
            customerId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }

      // 3. Create Order
      const orderRef = doc(collection(db, 'orders'));
      const finalAmount = (orderMeta.totalAmount || 0) - (orderMeta.discountAmount || 0) - (orderMeta.insuranceAmount || 0);
      
      // Auto-generate code if missing
      const orderCode = orderMeta.code || `ORD-${Date.now().toString().slice(-6)}`;

      transaction.set(orderRef, {
        ...orderMeta,
        code: orderCode,
        customerId,
        vehicleId,
        finalAmount,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Log Order Creation
      const logRef = doc(collection(db, 'systemLogs'));
      transaction.set(logRef, {
        action: 'CREATE_ORDER',
        orderId: orderRef.id,
        userId: orderMeta.createdBy,
        timestamp: new Date().toISOString()
      });

      // 4. Create Items
      for (const item of items) {
        const itemRef = doc(collection(db, `orders/${orderRef.id}/items`));
        transaction.set(itemRef, { ...item, orderId: orderRef.id });
      }

      return orderRef.id;
    });
  },

  // Update Status and Inventory
  async updateStatus(orderId: string, newStatus: OrderStatus, userId: string, paymentAmount?: number) {
    return await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) throw new Error("Order not found");
      
      const order = orderSnap.data() as Order;
      const oldStatus = order.status;

      // Deducting stock should happen only once
      if (oldStatus === 'pending' && newStatus === 'repairing') {
        const itemsColl = collection(db, `orders/${orderId}/items`);
        // Note: getDocs here is outside the atomic transaction guarantees for the collection itself
        // but it's the only way to find which docs to read/write in transaction
        const itemsSnap = await getDocs(itemsColl);
        
        for (const itemDoc of itemsSnap.docs) {
          const item = itemDoc.data() as OrderItem;
          if (item.productId) {
            const productRef = doc(db, 'products', item.productId);
            const productSnap = await transaction.get(productRef);
            if (productSnap.exists()) {
              const product = productSnap.data() as Product;
              if (product.stockQuantity < item.quantity) {
                throw new Error(`Sản phẩm ${product.name} không đủ tồn kho (Còn: ${product.stockQuantity}, Cần: ${item.quantity})`);
              }
              
              const stockBefore = product.stockQuantity;
              const stockAfter = product.stockQuantity - item.quantity;

              transaction.update(productRef, {
                stockQuantity: stockAfter,
                updatedAt: new Date().toISOString()
              });

              const logRef = doc(collection(db, 'inventoryLogs'));
              transaction.set(logRef, {
                productId: item.productId,
                type: 'export',
                quantity: item.quantity,
                stockBefore,
                stockAfter,
                notes: `Xuất kho sửa chữa - Đơn ${order.code}`,
                createdBy: userId,
                createdAt: new Date().toISOString()
              });
            }
          }
        }
      }

      // Logic: IF completed -> Update customer debt
      if (newStatus === 'completed') {
        const pay = paymentAmount || 0;
        const debtGenerated = Math.max(0, order.finalAmount - pay);

        if (debtGenerated > 0) {
          const customerRef = doc(db, 'customers', order.customerId);
          const customerSnap = await transaction.get(customerRef);
          if (customerSnap.exists()) {
            const customer = customerSnap.data() as Customer;
            const currentDebt = customer.debtBalance || 0;
            transaction.update(customerRef, {
              debtBalance: currentDebt + debtGenerated,
              updatedAt: new Date().toISOString()
            });
          }
        }
        
        transaction.update(orderRef, {
          paymentAmount: pay,
          updatedAt: new Date().toISOString()
        });
      }

      transaction.update(orderRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    });
  }
};
