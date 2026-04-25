import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Customer } from '../types';
import { Search, Plus, Car, User, Trash2, Edit3, X, Milestone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Vehicle {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  year?: number;
  vin?: string;
  customerId: string;
  customerName?: string;
  createdAt: string;
}

export const VehicleManagement = ({ userId }: { userId: string }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    licensePlate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    customerId: ''
  });

  useEffect(() => {
    // Fetch vehicles
    const q = query(collection(db, 'vehicles'), orderBy('licensePlate', 'asc'));
    const unsubscribeVehicles = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
      setVehicles(data);
      setLoading(false);
    });

    // Fetch customers for the dropdown
    const qCust = query(collection(db, 'customers'), orderBy('name', 'asc'));
    const unsubscribeCustomers = onSnapshot(qCust, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(data);
    });

    return () => {
      unsubscribeVehicles();
      unsubscribeCustomers();
    };
  }, []);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.licensePlate || !formData.customerId) {
      alert("Vui lòng nhập biển số và chọn khách hàng");
      return;
    }

    setIsSubmitting(true);
    try {
      const customer = customers.find(c => c.id === formData.customerId);
      await addDoc(collection(db, 'vehicles'), {
        ...formData,
        customerName: customer?.name || 'Unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setShowAddModal(false);
      setFormData({ licensePlate: '', brand: '', model: '', year: new Date().getFullYear(), vin: '', customerId: '' });
    } catch (error: any) {
      alert("Lỗi khi thêm xe: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Xóa thông tin xe này?")) {
      await deleteDoc(doc(db, 'vehicles', id));
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu xe...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-slate-900 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black border-l-8 border-brand-accent pl-3 uppercase tracking-tighter">Phương tiện</h1>
          <p className="text-slate-500 text-sm pl-3 font-medium text-slate-500 italic">Quản lý danh sách xe & Lịch sử sửa chữa</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 bg-brand-accent text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 shadow-xl shadow-brand-accent/30 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> Thêm xe mới
        </button>
      </div>

      <div className="card-sleek p-2 lg:p-4 flex flex-col sm:flex-row gap-3 items-center bg-white/80 backdrop-blur-sm sticky top-16 z-20 shadow-md">
        <div className="w-full sm:flex-1 flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 group focus-within:border-brand-accent focus-within:bg-white transition-all">
          <Search className="w-4 h-4 text-slate-400 group-focus-within:text-brand-accent" />
          <input 
            type="text" 
            placeholder="Tìm biển số, tên KH, hãng xe..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full font-bold text-slate-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map((vehicle) => (
          <div key={vehicle.id} className="card-sleek p-8 hover:border-brand-accent transition-all group overflow-hidden relative bg-white hover:shadow-2xl hover:scale-[1.01]">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all">
               <button onClick={() => handleDelete(vehicle.id)} className="p-3 bg-red-50 text-red-400 hover:text-red-700 hover:bg-red-100 rounded-2xl border border-red-100 transition-all shadow-sm">
                 <Trash2 className="w-4 h-4" />
               </button>
            </div>
            
            <div className="flex items-center gap-5 mb-8">
              <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-xl group-hover:bg-brand-accent transition-all transform group-hover:rotate-6">
                <Car className="w-8 h-8" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-xl font-black text-slate-900 tracking-widest font-mono uppercase bg-slate-100 px-3 py-1 rounded-xl border border-slate-200 inline-block mb-1">{vehicle.licensePlate}</div>
                <div className="text-[11px] text-slate-400 font-black uppercase tracking-widest">{vehicle.brand} {vehicle.model} <span className="opacity-40">|</span> {vehicle.year}</div>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-100 italic">
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 group-hover:bg-brand-accent/5 transition-colors">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                   <User className="w-4 h-4 text-brand-accent" />
                </div>
                <div>
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chủ sở hữu:</div>
                   <span className="text-sm font-black text-slate-700 uppercase tracking-tighter">{vehicle.customerName}</span>
                </div>
              </div>
              
              {vehicle.vin && (
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <Milestone className="w-3 h-3 text-slate-300" />
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest truncate">VIN: {vehicle.vin}</span>
                </div>
              )}
            </div>
            
            <div className="mt-8 flex gap-3">
               <button className="flex-1 px-4 py-4 bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-900 hover:text-white transition-all rounded-2xl shadow-sm">
                 Xem lịch sử
               </button>
               <button className="px-5 py-4 bg-slate-50 text-slate-400 hover:bg-white hover:text-brand-accent border border-transparent hover:border-slate-200 rounded-2xl transition-all shadow-sm">
                 <Edit3 className="w-4 h-4" />
               </button>
            </div>
          </div>
        ))}

        {filteredVehicles.length === 0 && (
          <div className="col-span-full py-40 text-center card-sleek bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem]">
             <Car className="w-16 h-16 text-slate-200 mx-auto mb-6 opacity-40" />
             <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Không tìm thấy phương tiện nào</p>
          </div>
        )}
      </div>

      {/* Add Vehicle Modal */}
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
              <form onSubmit={handleAddVehicle}>
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 text-slate-900">
                  <h2 className="font-black uppercase tracking-widest text-sm border-l-4 border-brand-accent pl-3">Thêm xe mới</h2>
                  <button type="button" onClick={() => setShowAddModal(false)} className="p-3 bg-white hover:bg-slate-100 text-slate-400 rounded-2xl border border-slate-200 shadow-sm transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-10 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2 col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Chủ phương tiện *</label>
                      <select 
                        required
                        value={formData.customerId}
                        onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-brand-accent/5 focus:border-brand-accent focus:bg-white rounded-2xl outline-none transition-all font-black text-sm shadow-inner cursor-pointer"
                      >
                        <option value="">-- Click để chọn khách hàng --</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id} className="bg-white">{c.name} - {c.phone}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Biển số xe *</label>
                      <input 
                        required
                        type="text" 
                        value={formData.licensePlate}
                        onChange={(e) => setFormData({...formData, licensePlate: e.target.value.toUpperCase()})}
                        placeholder="VD: 30A-123.45" 
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-accent focus:bg-white rounded-2xl outline-none font-mono font-black tracking-widest text-sm shadow-inner shadow-slate-200 transition-all" 
                      />
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Năm sản xuất</label>
                      <input 
                        type="number" 
                        value={formData.year}
                        onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-accent focus:bg-white rounded-2xl outline-none text-sm font-black shadow-inner" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Hãng xe *</label>
                      <input 
                        required
                        type="text" 
                        value={formData.brand}
                        onChange={(e) => setFormData({...formData, brand: e.target.value})}
                        placeholder="VD: Toyota" 
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-accent focus:bg-white rounded-2xl outline-none text-sm font-black shadow-inner" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Dòng xe *</label>
                      <input 
                        required
                        type="text" 
                        value={formData.model}
                        onChange={(e) => setFormData({...formData, model: e.target.value})}
                        placeholder="VD: Camry" 
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-accent focus:bg-white rounded-2xl outline-none text-sm font-black shadow-inner" 
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Số khung (VIN)</label>
                      <input 
                        type="text" 
                        value={formData.vin}
                        onChange={(e) => setFormData({...formData, vin: e.target.value.toUpperCase()})}
                        placeholder="Mã số định danh VIN (nếu có)" 
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-accent focus:bg-white rounded-2xl outline-none font-mono text-sm font-bold shadow-inner" 
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
