import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, Customer, Product } from '../types';
import { formatCurrency, formatDateTime, cn } from '../lib/utils';
import { Search, Plus, Filter, Eye, CheckCircle2, CheckSquare, Clock, X, Trash2, Package, User, Car, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OrderService } from '../services/orderService';

interface Vehicle {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  customerId: string;
}

export const OrderManagement = ({ userId }: { userId: string }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data for Form
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Form State
  const [searchPhone, setSearchPhone] = useState('');
  const [searchPlate, setSearchPlate] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [orderItems, setOrderItems] = useState<{ productId: string, name: string, quantity: number, price: number }[]>([]);
  const [serviceFee, setServiceFee] = useState(0);
  const [notes, setNotes] = useState('');

  // Auto-search logic
  useEffect(() => {
    if (searchPhone.length >= 10) {
      const match = customers.find(c => c.phone === searchPhone);
      if (match) setSelectedCustomerId(match.id);
    }
  }, [searchPhone, customers]);

  useEffect(() => {
    if (searchPlate.length >= 7) {
      const match = vehicles.find(v => v.licensePlate.toLowerCase().replace(/[-. ]/g, '') === searchPlate.toLowerCase().replace(/[-. ]/g, ''));
      if (match) {
        setSelectedVehicleId(match.id);
        setSelectedCustomerId(match.customerId);
      }
    }
  }, [searchPlate, vehicles]);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(data);
      setLoading(false);
    });

    // Fetch master data
    onSnapshot(collection(db, 'customers'), (s) => setCustomers(s.docs.map(d => ({ id: d.id, ...d.data() } as Customer))));
    onSnapshot(collection(db, 'products'), (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() } as Product))));
    onSnapshot(collection(db, 'vehicles'), (s) => setVehicles(s.docs.map(d => ({ id: d.id, ...d.data() } as Vehicle))));

    return () => unsubscribe();
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedVehicleId || orderItems.length === 0) {
      alert("Vui lòng chọn khách hàng, xe và ít nhất 1 sản phẩm/dịch vụ");
      return;
    }

    setIsSubmitting(true);
    try {
      const customer = customers.find(c => c.id === selectedCustomerId);
      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      
      const totalParts = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const totalAmount = totalParts + serviceFee;

      await OrderService.createOrder(
        selectedCustomerId,
        selectedVehicleId,
        orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          name: item.name
        })),
        {
          code: `ORD-${Date.now().toString().slice(-6)}`,
          customerName: customer?.name || 'Unknown',
          vehiclePlate: vehicle?.licensePlate || 'Unknown',
          totalAmount,
          finalAmount: totalAmount,
          serviceAmount: serviceFee,
          status: 'pending',
          createdBy: userId,
          notes
        }
      );

      setShowAddModal(false);
      resetForm();
    } catch (error: any) {
      alert("Lỗi khi tạo đơn: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setSelectedVehicleId('');
    setOrderItems([]);
    setServiceFee(0);
    setNotes('');
  };

  const handleAddItem = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    if (product.stockQuantity <= 0) {
      alert("Sản phẩm đã hết hàng trong kho!");
      return;
    }

    const existing = orderItems.find(i => i.productId === productId);
    if (existing) {
      setOrderItems(orderItems.map(i => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setOrderItems([...orderItems, { productId: product.id, name: product.name, quantity: 1, price: product.priceSale }]);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
     try {
       // Status specific logic can be added here (like stock deduction on 'repairing')
       await OrderService.updateStatus(orderId, newStatus as any, userId);
     } catch (err: any) {
       alert(err.message);
     }
  };

  const filteredOrders = orders.filter(o => 
    o.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const customerVehicles = vehicles.filter(v => v.customerId === selectedCustomerId);

  if (loading) return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu đơn hàng...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-slate-900 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black border-l-8 border-brand-accent pl-3 uppercase tracking-tighter">Lệnh sửa chữa</h1>
          <p className="text-slate-500 text-sm pl-3 font-medium">Bảo trì & Sửa chữa phương tiện</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 bg-brand-accent text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 shadow-xl shadow-brand-accent/30 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> Tạo lệnh mới
        </button>
      </div>

      <div className="card-sleek p-2 lg:p-4 flex flex-col sm:flex-row gap-3 items-center bg-white/80 backdrop-blur-sm sticky top-16 z-20 shadow-md">
        <div className="w-full sm:flex-1 flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 group focus-within:border-brand-accent focus-within:bg-white transition-all">
          <Search className="w-4 h-4 text-slate-400 group-focus-within:text-brand-accent" />
          <input 
            type="text" 
            placeholder="Tìm biển số, tên KH, mã đơn..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full font-bold text-slate-700"
          />
        </div>
        <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
          <Filter className="w-4 h-4" /> Lọc trạng thái
        </button>
      </div>

      <div className="card-sleek overflow-hidden border-t-4 border-brand-accent shadow-xl">
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full text-left font-sans min-w-[800px]">
            <thead className="bg-slate-50 border-b border-brand-border">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã lệnh</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Biển số</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Khách hàng</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng tiền</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border text-sm">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-5 font-black text-brand-accent bg-slate-50/30">{order.code}</td>
                  <td className="px-6 py-4 font-mono text-xs font-black text-slate-900 tracking-tighter">
                    <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200">{order.vehiclePlate}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">{order.customerName}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "badge-sleek px-3 py-1.5",
                      order.status === 'completed' && "bg-slate-100 text-slate-600 border border-slate-300",
                      order.status === 'repairing' && "bg-blue-100 text-blue-800 border border-blue-200",
                      order.status === 'pending' && "bg-yellow-100 text-yellow-800 border border-yellow-200",
                      order.status === 'cancelled' && "bg-red-100 text-red-800 border border-red-200",
                    )}>
                      {order.status === 'pending' ? 'Chờ xử lý' : 
                       order.status === 'repairing' ? 'Đang sửa' : 
                       order.status === 'completed' ? 'Hoàn tất' : 'Đã hủy'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-black text-slate-900 text-base">
                    {formatCurrency(order.finalAmount)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-brand-accent transition-all shadow-sm">
                        <Eye className="w-4 h-4" />
                      </button>
                      {order.status === 'pending' && (
                        <button 
                          onClick={() => handleStatusChange(order.id, 'repairing')}
                          className="p-3 bg-white hover:bg-blue-50 border border-slate-200 rounded-xl text-blue-400 hover:text-blue-600 shadow-sm" 
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      {order.status === 'repairing' && (
                        <button 
                          onClick={() => handleStatusChange(order.id, 'completed')}
                          className="p-3 bg-white hover:bg-emerald-50 border border-slate-200 rounded-xl text-emerald-400 hover:text-emerald-600 shadow-sm" 
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Chưa có dữ liệu lệnh sửa chữa.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-white/20"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                   <h2 className="font-black text-slate-900 uppercase tracking-widest text-sm border-l-4 border-brand-accent pl-3">Tạo lệnh mới</h2>
                   <p className="text-[10px] text-slate-400 font-bold ml-4 mt-1">Hệ thống auto-save dữ liệu tạm</p>
                </div>
                <button type="button" onClick={() => setShowAddModal(false)} className="p-3 bg-white hover:bg-slate-100 text-slate-400 rounded-2xl border border-slate-200 shadow-sm transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Information Side */}
                <div className="lg:col-span-7 space-y-8">
                   <div className="space-y-6">
                      <div className="flex items-center gap-3 text-slate-400 mb-2">
                         <div className="p-2 bg-slate-100 rounded-lg text-brand-accent shadow-inner"><Car className="w-4 h-4" /></div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Thông tin khách & Phương tiện</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">SĐT Khách hàng</label>
                          <input 
                            type="text" 
                            placeholder="Nhập SĐT tìm nhanh..."
                            value={searchPhone}
                            onChange={(e) => setSearchPhone(e.target.value)}
                            className="w-full px-5 py-4 bg-white border-2 border-transparent hover:border-slate-200 focus:border-brand-accent rounded-2xl outline-none transition-all text-sm font-black shadow-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Biển số xe</label>
                          <input 
                            type="text" 
                            placeholder="Nhập biển số tìm..."
                            value={searchPlate}
                            onChange={(e) => setSearchPlate(e.target.value)}
                            className="w-full px-5 py-4 bg-white border-2 border-transparent hover:border-slate-200 focus:border-brand-accent rounded-2xl outline-none transition-all text-sm font-mono font-black tracking-widest uppercase shadow-sm"
                          />
                        </div>
                        
                        <div className="space-y-2 col-span-1 sm:col-span-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Xác nhận khách hàng *</label>
                          <select 
                            required
                            value={selectedCustomerId}
                            onChange={(e) => {
                              setSelectedCustomerId(e.target.value);
                              setSelectedVehicleId('');
                            }}
                            className="w-full px-5 py-4 bg-white border-2 border-brand-accent/10 focus:border-brand-accent rounded-2xl outline-none transition-all font-black text-sm shadow-sm cursor-pointer"
                          >
                            <option value="">-- Click để chọn khách hàng --</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                          </select>
                        </div>

                        <div className="space-y-2 col-span-1 sm:col-span-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Chọn phương tiện *</label>
                          <select 
                            required
                            disabled={!selectedCustomerId}
                            value={selectedVehicleId}
                            onChange={(e) => setSelectedVehicleId(e.target.value)}
                            className="w-full px-5 py-4 bg-white border-2 border-brand-accent/5 focus:border-brand-accent rounded-2xl outline-none transition-all font-mono font-black tracking-wider text-sm disabled:opacity-50 shadow-sm cursor-pointer"
                          >
                            <option value="">{selectedCustomerId ? '-- Click để chọn biển số --' : 'Vui lòng chọn khách hàng trước'}</option>
                            {customerVehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate} - {v.brand} {v.model}</option>)}
                          </select>
                        </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center gap-3 text-slate-400 mb-2">
                         <div className="p-2 bg-slate-100 rounded-lg text-orange-500 shadow-inner"><FileText className="w-4 h-4" /></div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Yêu cầu & Ghi chú từ khách</span>
                      </div>
                      <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Mô tả tình trạng xe (VD: Điều hòa không lạnh, kêu phanh...), yêu cầu của khách..." 
                        className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent focus:border-brand-accent focus:bg-white rounded-3xl outline-none transition-all min-h-[140px] resize-none text-sm font-medium shadow-inner"
                      />
                   </div>
                </div>

                {/* Items/Pricing Side */}
                <div className="lg:col-span-5 space-y-6 flex flex-col">
                   <div className="flex items-center gap-3 text-slate-400 mb-2">
                      <div className="p-2 bg-slate-100 rounded-lg text-emerald-500 shadow-inner"><Package className="w-4 h-4" /></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nội dung sửa chữa & Vật tư</span>
                   </div>

                   <div className="flex-1 bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 flex flex-col text-slate-400 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent opacity-10 blur-3xl -mr-10 -mt-10"></div>
                      
                      <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] mb-8 pr-2 custom-scrollbar">
                        {orderItems.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 group hover:border-white/20 transition-all">
                            <div className="flex-1 pr-4">
                              <div className="font-bold text-xs text-white uppercase tracking-wider mb-1">{item.name}</div>
                              <div className="text-[10px] text-slate-500 font-black">Số lượng: {item.quantity} | {formatCurrency(item.price)}</div>
                            </div>
                            <div className="flex items-center gap-4">
                               <span className="font-black text-sm text-brand-accent">{formatCurrency(item.price * item.quantity)}</span>
                               <button 
                                 onClick={() => setOrderItems(orderItems.filter((_, i) => i !== idx))}
                                 className="p-2 text-slate-600 hover:text-red-400 hover:bg-white/5 rounded-xl transition-all"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                          </div>
                        ))}
                        {orderItems.length === 0 && (
                          <div className="h-full min-h-[150px] flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-[2rem] gap-4">
                            <Package className="w-8 h-8 opacity-20" />
                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-center px-8">
                              Vui lòng chọn vật tư từ menu bên dưới
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-6 border-t border-white/10 space-y-4">
                         <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <span>TIỀN VẬT TƯ:</span>
                            <span className="text-white text-xs">{formatCurrency(orderItems.reduce((acc, i) => acc + (i.price * i.quantity), 0))}</span>
                         </div>
                         <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <span>PHÍ DỊCH VỤ / CÔNG:</span>
                            <div className="flex items-center gap-2">
                               <input 
                                 type="number" 
                                 value={serviceFee}
                                 onChange={(e) => setServiceFee(parseInt(e.target.value) || 0)}
                                 className="w-32 bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1.5 text-right outline-none focus:border-brand-accent transition-all font-black text-xs"
                               />
                            </div>
                         </div>
                         <div className="flex justify-between items-center pt-4 border-t border-white/5">
                            <span className="text-xs font-black text-white uppercase tracking-[0.2em]">TỔNG THANH TOÁN:</span>
                            <span className="text-3xl font-black text-brand-accent tracking-tighter">
                              {formatCurrency(orderItems.reduce((acc, i) => acc + (i.price * i.quantity), 0) + serviceFee)}
                            </span>
                         </div>
                      </div>
                   </div>

                   <div className="relative group">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-100 group-focus-within:text-brand-accent transition-colors z-10" />
                      <select 
                        onChange={(e) => {
                          if (e.target.value) handleAddItem(e.target.value);
                          e.target.value = '';
                        }}
                        className="w-full pl-14 pr-8 py-5 bg-slate-900 border-2 border-slate-800 text-white rounded-[2rem] outline-none font-black text-xs uppercase tracking-[0.15em] focus:border-brand-accent transition-all cursor-pointer shadow-2xl appearance-none"
                      >
                         <option value="">+ THÊM PHỤ TÙNG & VẬT TƯ</option>
                         {products.map(p => (
                           <option key={p.id} value={p.id} disabled={p.stockQuantity <= 0} className="bg-slate-800 py-4">
                             {p.name} - {formatCurrency(p.priceSale)} (CÒN: {p.stockQuantity})
                           </option>
                         ))}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                        <Plus className="w-5 h-5" />
                      </div>
                   </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-4 shadow-inner">
                <button type="button" onClick={() => setShowAddModal(false)} className="w-full sm:w-auto px-8 py-4 rounded-2xl border-2 border-slate-200 hover:bg-white hover:border-slate-300 text-sm font-black uppercase tracking-widest text-slate-500 transition-all">Hủy bỏ</button>
                <button 
                  disabled={isSubmitting}
                  onClick={handleCreateOrder}
                  type="button" 
                  className="w-full sm:w-auto px-12 py-4 rounded-2xl bg-brand-accent text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-blue-700 shadow-2xl shadow-brand-accent/40 transition-all disabled:opacity-50 active:scale-95"
                >
                  {isSubmitting ? 'HỆ THỐNG ĐANG XỬ LÝ...' : 'XÁC NHẬN TẠO LỆNH'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
