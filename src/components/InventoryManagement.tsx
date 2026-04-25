import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { Search, Plus, AlertTriangle, Package, Edit3, Trash2, BadgeDollarSign, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { InventoryService } from '../services/inventoryService';

export const InventoryManagement = ({ userId }: { userId: string }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    priceImport: 0,
    priceSale: 0,
    stockQuantity: 0,
    minStockAlert: 5,
    isConsignment: false
  });

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) {
      alert("Vui lòng nhập tên và mã SKU");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await InventoryService.updateProduct(editingId, formData);
      } else {
        await InventoryService.addProduct(formData, userId);
      }
      setShowAddModal(false);
      setEditingId(null);
      setFormData({ name: '', sku: '', priceImport: 0, priceSale: 0, stockQuantity: 0, minStockAlert: 5, isConsignment: false });
    } catch (error: any) {
      alert("Lỗi: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      sku: product.sku,
      priceImport: product.priceImport,
      priceSale: product.priceSale,
      stockQuantity: product.stockQuantity,
      minStockAlert: product.minStockAlert,
      isConsignment: product.isConsignment
    });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setFormData({ name: '', sku: '', priceImport: 0, priceSale: 0, stockQuantity: 0, minStockAlert: 5, isConsignment: false });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu kho...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 border-l-4 border-brand-accent pl-3">Quản lý kho hàng</h1>
          <p className="text-slate-500 text-sm pl-3">Theo dõi tồn kho, phụ tùng và vật tư.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-brand-accent text-white rounded-lg font-bold uppercase tracking-widest text-[11px] hover:bg-blue-700 shadow-lg shadow-brand-accent/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Thêm sản phẩm
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card-sleek p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg"><Package className="w-5 h-5 text-blue-600" /></div>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Tổng mặt hàng</span>
          </div>
          <div className="text-2xl font-bold">{products.length}</div>
        </div>
        <div className="card-sleek p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg"><AlertTriangle className="w-5 h-5 text-orange-600" /></div>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Sắp hết hàng</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {products.filter(p => p.stockQuantity <= p.minStockAlert).length}
          </div>
        </div>
        <div className="card-sleek p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg"><BadgeDollarSign className="w-5 h-5 text-emerald-600" /></div>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Giá trị kho</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {formatCurrency(products.reduce((acc, p) => acc + (p.stockQuantity * p.priceImport), 0))}
          </div>
        </div>
      </div>

      <div className="card-sleek p-4">
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm theo tên sản phẩm hoặc mã SKU..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full font-sans"
          />
        </div>
      </div>

      <div className="card-sleek overflow-hidden border-t-4 border-brand-accent">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead className="bg-slate-50 border-b border-brand-border">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sản phẩm</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Loại</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Tồn kho</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Mức tối thiểu</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Giá bán</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border text-sm">
              {filteredProducts.map((product) => {
                const isLowStock = product.stockQuantity <= product.minStockAlert;
                return (
                  <tr key={product.id} className={cn(
                    "hover:bg-slate-50/50 transition-colors",
                    isLowStock && "bg-red-50/30"
                  )}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 border-l-2 border-brand-accent pl-3">{product.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono tracking-widest pl-3 uppercase">{product.sku}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "badge-sleek",
                        product.isConsignment ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                      )}>
                        {product.isConsignment ? 'Ký gửi' : 'Tự nhập'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={cn(
                        "flex items-center justify-center gap-2 font-black text-base",
                        isLowStock ? "text-red-600" : "text-slate-900"
                      )}>
                        {product.stockQuantity}
                        {isLowStock && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-500 bg-slate-50/30">
                      {product.minStockAlert}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Giá bán:</div>
                      <div className="text-sm font-black text-slate-900">{formatCurrency(product.priceSale)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => handleEdit(product)}
                            className="p-2.5 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl text-slate-400 hover:text-brand-accent transition-all shadow-sm"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="p-2.5 hover:bg-white border border-transparent hover:border-red-100 rounded-xl text-slate-400 hover:text-red-600 transition-all shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="font-sans">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h2 className="font-black text-slate-900 border-l-4 border-brand-accent pl-3 uppercase tracking-widest text-sm">
                    {editingId ? 'Cập nhật phụ tùng' : 'Thêm phụ tùng mới'}
                  </h2>
                  <button type="button" onClick={handleCloseModal} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-8 space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1 col-span-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tên sản phẩm *</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="VD: Dầu nhớt Castrol 5W-40" 
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-brand-accent transition-all text-sm font-medium" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mã SKU *</label>
                      <input 
                        required
                        type="text" 
                        value={formData.sku}
                        onChange={(e) => setFormData({...formData, sku: e.target.value})}
                        placeholder="Mã phân loại" 
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-brand-accent transition-all text-sm uppercase font-bold" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Số lượng tồn kho *</label>
                      <input 
                        required
                        type="number" 
                        value={formData.stockQuantity}
                        onChange={(e) => setFormData({...formData, stockQuantity: parseInt(e.target.value) || 0})}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-brand-accent transition-all text-sm font-bold" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mức báo động (Min) *</label>
                      <input 
                        required
                        type="number" 
                        value={formData.minStockAlert}
                        onChange={(e) => setFormData({...formData, minStockAlert: parseInt(e.target.value) || 0})}
                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:border-brand-accent transition-all text-sm font-bold text-red-600" 
                      />
                    </div>
                    <div className="space-y-1 text-slate-900">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Loại hàng</label>
                      <div className="flex items-center h-[46px] gap-3 bg-slate-50 px-4 rounded-2xl border border-slate-100">
                         <input 
                          type="checkbox" 
                          checked={formData.isConsignment}
                          onChange={(e) => setFormData({...formData, isConsignment: e.target.checked})}
                          id="consignment" 
                          className="w-4 h-4 text-brand-accent accent-brand-accent rounded cursor-pointer"
                         />
                         <label htmlFor="consignment" className="text-xs font-bold text-slate-600 cursor-pointer">Hàng ký gửi</label>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Giá nhập (VNĐ) *</label>
                      <input 
                        required
                        type="number" 
                        value={formData.priceImport}
                        onChange={(e) => setFormData({...formData, priceImport: parseInt(e.target.value) || 0})}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-brand-accent transition-all text-sm font-bold" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Giá bán (VNĐ) *</label>
                      <input 
                        required
                        type="number" 
                        value={formData.priceSale}
                        onChange={(e) => setFormData({...formData, priceSale: parseInt(e.target.value) || 0})}
                        className="w-full px-5 py-3 bg-white border-2 border-brand-accent/20 rounded-2xl outline-none focus:border-brand-accent transition-all text-sm font-bold text-brand-accent" 
                      />
                    </div>
                  </div>
                </div>
                <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
                  <button type="button" onClick={handleCloseModal} className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-200 hover:bg-white text-sm font-bold transition-all">Hủy</button>
                  <button 
                    disabled={isSubmitting}
                    type="submit" 
                    className="w-full sm:w-auto px-10 py-3 rounded-2xl bg-brand-accent text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-brand-accent/30 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (editingId ? 'Đang cập nhật...' : 'Đang lưu...') : (editingId ? 'Xác nhận cập nhật' : 'Xác nhận lưu')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
