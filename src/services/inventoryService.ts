import { collection, addDoc, doc, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';

export const InventoryService = {
  /**
   * Adds a new product and creates initial inventory log
   */
  async addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, userId: string) {
    return runTransaction(db, async (transaction) => {
      const productRef = doc(collection(db, 'products'));
      const timestamp = new Date().toISOString();
      
      const newProduct = {
        ...productData,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      transaction.set(productRef, newProduct);

      // Create initial log
      const logRef = doc(collection(db, 'inventoryLogs'));
      transaction.set(logRef, {
        productId: productRef.id,
        type: 'import',
        quantity: productData.stockQuantity,
        stockBefore: 0,
        stockAfter: productData.stockQuantity,
        notes: 'Khởi tạo sản phẩm mới',
        createdBy: userId,
        createdAt: timestamp
      });

      return productRef.id;
    });
  },

  /**
   * Updates product details
   */
  async updateProduct(productId: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) {
    const productRef = doc(db, 'products', productId);
    const timestamp = new Date().toISOString();
    return updateDoc(productRef, {
      ...productData,
      updatedAt: timestamp
    });
  },

  /**
   * Updates stock for an existing product with logging
   */
  async updateStock(productId: string, quantityChange: number, type: 'import' | 'export' | 'adjustment', userId: string, notes?: string) {
    return runTransaction(db, async (transaction) => {
      const productRef = doc(db, 'products', productId);
      const productSnap = await transaction.get(productRef);

      if (!productSnap.exists()) {
        throw new Error("Sản phẩm không tồn tại");
      }

      const product = productSnap.data() as Product;
      const newStock = product.stockQuantity + quantityChange;

      if (newStock < 0) {
        throw new Error("Số lượng tồn kho không đủ để thực hiện thao tác này");
      }

      const timestamp = new Date().toISOString();

      transaction.update(productRef, {
        stockQuantity: newStock,
        updatedAt: timestamp
      });

      // Create log
      const logRef = doc(collection(db, 'inventoryLogs'));
      transaction.set(logRef, {
        productId,
        type,
        quantity: Math.abs(quantityChange),
        stockBefore: product.stockQuantity,
        stockAfter: newStock,
        notes: notes || (type === 'import' ? 'Nhập hàng' : 'Xuất hàng'),
        createdBy: userId,
        createdAt: timestamp
      });

      return newStock;
    });
  }
};
