import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Customer } from '../types';
import { Search, Plus, Phone, MapPin, FileText, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const CustomerManagement = ({ userId }: { userId: string }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
    birthday: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert("Vui lòng nhập tên và số điện thoại");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'customers'), {
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setShowAddModal(false);
      setFormData({ name: '', phone: '', address: '', notes: '', birthday: '' });
    } catch (error: any) {
      alert("Lỗi khi thêm khách hàng: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Xóa khách hàng này?")) {
      await deleteDoc(doc(db, 'customers', id));
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  if (loading) return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu khách hàng...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-slate-900 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black border-l-8 border-brand-accent pl-3 uppercase tracking-tighter">Khách hàng</h1>
          <p className="text-slate-500 text-sm pl-3 font-medium text-slate-500 italic">Quản lý hồ sơ & Công nợ khách hàng</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 bg-brand-accent text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 shadow-xl shadow-brand-accent/30 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> Thêm khách hàng
        </button>
      </div>

      <div className="card-sleek p-2 lg:p-4 flex flex-col sm:flex-row gap-3 items-center bg-white/80 backdrop-blur-sm sticky top-16 z-20 shadow-md">
        <div className="w-full sm:flex-1 flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 group focus-within:border-brand-accent focus-within:bg-white transition-all">
          <Search className="w-4 h-4 text-slate-400 group-focus-within:text-brand-accent" />
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
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="card-sleek p-8 hover:border-brand-accent transition-all group relative overflow-hidden bg-white hover:shadow-2xl hover:scale-[1.01]">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-row gap-2 z-10">
               <button 
                 onClick={() => handleDelete(customer.id)}
                 className="p-3 bg-red-50 text-red-400 hover:text-red-700 hover:bg-red-100 rounded-2xl border border-red-100 transition-all shadow-sm"
               >
                 <X className="w-4 h-4" />
               </button>
            </div>
            
            <div className="flex items-center gap-5 mb-8">
              <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-xl group-hover:bg-brand-accent transition-all transform group-hover:rotate-6">
                {customer.name.charAt(0)}
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-black text-slate-900 text-lg leading-tight uppercase tracking-tighter truncate">{customer.name}</h3>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 uppercase font-black tracking-widest">
                  <Phone className="w-3 h-3 text-brand-accent" /> {customer.phone}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                   {customer.address && (
                     <div className="flex items-start gap-3 text-xs text-slate-600 font-bold">
                       <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                       <span className="leading-relaxed">{customer.address}</span>
                     </div>
                   )}
                   <div className="flex items-start gap-3 text-xs text-slate-500 font-medium italic">
                     <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                     <span className="leading-relaxed">{customer.notes || 'Ghi chú hệ thống...'}</span>
                   </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-2xl border border-red-100/50">
                   <div className="text-[10px] font-black text-red-400 uppercase tracking-widest">Công nợ hiện tại:</div>
                   <div className="text-sm font-black text-red-600">
                      {customer.debtBalance ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(customer.debtBalance) : '0 ₫'}
                   </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
              <button className="flex-1 px-4 py-3 bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-900 hover:text-white transition-all rounded-2xl shadow-sm">
                Chi tiết
              </button>
              <button className="flex-1 px-4 py-3 bg-brand-accent text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all rounded-2xl shadow-lg shadow-brand-accent/20 active:scale-95">
                Tạo lệnh mới
              </button>
            </div>
          </div>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="col-span-full py-40 text-center card-sleek bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem]">
             <Search className="w-16 h-16 text-slate-200 mx-auto mb-6" />
             <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Không tìm thấy thông tin khách hàng</p>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
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
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20"
            >
              <form onSubmit={handleAddCustomer}>
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h2 className="font-black text-slate-900 uppercase tracking-widest text-sm border-l-4 border-brand-accent pl-3">Khách hàng mới</h2>
                  <button type="button" onClick={() => setShowAddModal(false)} className="p-3 bg-white hover:bg-slate-100 text-slate-400 rounded-2xl border border-slate-200 shadow-sm transition-all focus:outline-none">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-10 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2 col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Họ và tên *</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="VD: Nguyễn Văn A" 
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-accent focus:bg-white rounded-2xl outline-none transition-all text-sm font-black shadow-inner" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Số điện thoại *</label>
                      <input 
                        required
                        type="tel" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="VD: 0987654321" 
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-accent focus:bg-white rounded-2xl outline-none text-sm font-black shadow-inner" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Ngày sinh</label>
                      <input 
                        type="date" 
                        value={formData.birthday}
                        onChange={(e) => setFormData({...formData, birthday: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-accent focus:bg-white rounded-2xl outline-none text-sm font-bold shadow-inner" 
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Địa chỉ thường trú</label>
                      <input 
                        type="text" 
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        placeholder="VD: 123 Đường ABC, Quận XYZ..." 
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-accent focus:bg-white rounded-2xl outline-none text-sm font-medium shadow-inner" 
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Ghi chú đặc biệt</label>
                      <textarea 
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        placeholder="Sở thích khách hàng, dòng xe quan tâm, lưu ý nợ..." 
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-accent focus:bg-white rounded-[2rem] outline-none min-h-[120px] resize-none text-sm font-medium shadow-inner" 
                      />
                    </div>
                  </div>
                </div>
                <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-4 shadow-inner">
                  <button type="button" onClick={() => setShowAddModal(false)} className="w-full sm:w-auto px-8 py-4 rounded-2xl border-2 border-slate-200 hover:bg-white text-[11px] font-black uppercase tracking-widest text-slate-500 transition-all">Hủy bỏ</button>
                  <button 
                    disabled={isSubmitting}
                    type="submit" 
                    className="w-full sm:w-auto px-12 py-4 rounded-2xl bg-brand-accent text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-2xl shadow-brand-accent/40 transition-all disabled:opacity-50 active:scale-95"
                  >
                    {isSubmitting ? 'ĐANG LƯU HỆ THỐNG...' : 'XÁC NHẬN LƯU'}
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
