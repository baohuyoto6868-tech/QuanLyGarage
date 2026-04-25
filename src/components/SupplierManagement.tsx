import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatCurrency, cn } from '../lib/utils';
import { Search, Plus, Phone, MapPin, BadgeDollarSign, Edit3, Trash2, X, Factory } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  debtBalance: number;
  createdAt: string;
}

export const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    debtBalance: 0
  });

  useEffect(() => {
    const q = query(collection(db, 'suppliers'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
      setSuppliers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert("Vui lòng nhập tên và số điện thoại");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'suppliers'), {
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setShowAddModal(false);
      setFormData({ name: '', phone: '', address: '', debtBalance: 0 });
    } catch (error: any) {
      alert("Lỗi khi thêm nhà cung cấp: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nhà cung cấp này?")) {
      await deleteDoc(doc(db, 'suppliers', id));
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm)
  );

  if (loading) return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu nhà cung cấp...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-900">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-slate-900 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black border-l-8 border-brand-accent pl-3 uppercase tracking-tighter">Nhà cung cấp</h1>
          <p className="text-slate-500 text-sm pl-3 font-medium italic">Quản lý đối tác phụ tùng & Vật tư</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 bg-brand-accent text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 shadow-xl shadow-brand-accent/30 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> Thêm nhà cung cấp mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-sleek p-8 bg-white hover:shadow-xl transition-all border-l-8 border-blue-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-2xl"><Factory className="w-6 h-6 text-blue-600" /></div>
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Tổng số đối tác</span>
          </div>
          <div className="text-4xl font-black text-slate-900 tracking-tighter">{suppliers.length}</div>
        </div>
        <div className="card-sleek p-8 bg-white hover:shadow-xl transition-all border-l-8 border-red-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-100 rounded-2xl"><BadgeDollarSign className="w-6 h-6 text-red-600" /></div>
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Tổng nợ đối tác</span>
          </div>
          <div className="text-4xl font-black text-red-600 tracking-tighter">
            {formatCurrency(suppliers.reduce((acc, s) => acc + (s.debtBalance || 0), 0))}
          </div>
        </div>
      </div>

      <div className="card-sleek p-2 lg:p-4 bg-white shadow-md">
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 focus-within:border-brand-accent transition-all">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc số điện thoại..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full font-bold text-slate-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier) => (
          <div key={supplier.id} className="card-sleek p-8 hover:shadow-2xl transition-all group border-t-8 border-brand-accent bg-white relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{supplier.name}</h3>
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2 border-b border-slate-100 pb-1">
                  <Phone className="w-3 h-3 text-brand-accent" />
                  {supplier.phone}
                </div>
              </div>
              <button 
                onClick={() => handleDelete(supplier.id)}
                className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100 shadow-sm"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <MapPin className="w-5 h-5 mt-0.5 text-brand-accent" />
                <span className="text-xs font-bold text-slate-600 line-clamp-2">{supplier.address || 'Chưa cập nhật địa chỉ'}</span>
              </div>
              <div className="bg-slate-900 p-5 rounded-2xl flex flex-col gap-1 shadow-inner shadow-black/20">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nợ hiện tại</span>
                <span className={cn(
                  "font-black text-2xl tracking-tighter",
                  supplier.debtBalance > 0 ? "text-red-400" : "text-emerald-400"
                )}>
                  {formatCurrency(supplier.debtBalance || 0)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>


      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleAddSupplier}>
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h2 className="font-bold text-slate-900 border-l-4 border-brand-accent pl-3">Thêm nhà cung cấp</h2>
                  <button type="button" onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-200 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-8 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tên nhà cung cấp *</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="VD: Phụ tùng ô tô Hà Nội" 
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Số điện thoại *</label>
                    <input 
                      required
                      type="text" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="Số điện thoại liên hệ" 
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Địa chỉ</label>
                    <input 
                      type="text" 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Địa chỉ giao dịch" 
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Công nợ hiện tại (VNĐ)</label>
                    <input 
                      type="number" 
                      value={formData.debtBalance}
                      onChange={(e) => setFormData({...formData, debtBalance: parseInt(e.target.value) || 0})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none" 
                    />
                  </div>
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-3 rounded-2xl border border-slate-200 hover:bg-white text-sm font-bold">Hủy</button>
                  <button 
                    disabled={isSubmitting}
                    type="submit" 
                    className="px-8 py-3 rounded-2xl bg-brand-accent text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-brand-accent/20 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang lưu...' : 'Lưu thông tin'}
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
