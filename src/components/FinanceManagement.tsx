import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, Customer } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  ArrowUpRight, 
  Search,
  Filter,
  Download,
  CreditCard,
  History,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export const FinanceManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribeOrders = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(data);
      setLoading(false);
    });

    const unsubscribeCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    });

    return () => {
      unsubscribeOrders();
      unsubscribeCustomers();
    };
  }, []);

  const totalRevenue = orders.reduce((acc, o) => acc + (o.finalAmount || 0), 0);
  const totalDebt = customers.reduce((acc, c) => acc + (c.debtBalance || 0), 0);
  const totalServiceFee = orders.reduce((acc, o) => acc + (o.serviceAmount || 0), 0);
  
  // Estimate parts cost (mock logic: 60% of total amount - service fee)
  const estimatedPartsCost = orders.reduce((acc, o) => acc + ((o.totalAmount || 0) - (o.serviceAmount || 0)) * 0.7, 0);
  const estimatedProfit = totalRevenue - estimatedPartsCost;

  // Chart data preparation (Group by day of week from last 7 days)
  const getDailyData = () => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const now = new Date();
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayName = days[d.getDay()];
      const dateStr = d.toISOString().split('T')[0];

      const dayOrders = orders.filter(o => o.createdAt.startsWith(dateStr));
      const revenue = dayOrders.reduce((acc, o) => acc + (o.finalAmount || 0), 0);
      
      // Calculate debt origin from these orders (Orders that were completed but not fully paid)
      // Since our schema might not track partial payments in 'orders' perfectly, we'll use a heuristic 
      // or check if there's a 'debtGenerated' field (which we added in orderService if applicable).
      // For now, let's just use the revenue to show some trend, and maybe mock debt trend or set to 0.
      const debt = dayOrders.reduce((acc, o) => acc + ((o.finalAmount || 0) - (o.paymentAmount || o.finalAmount || 0)), 0);

      result.push({
        name: dayName,
        revenue,
        debt: Math.max(0, debt)
      });
    }
    return result;
  };

  const dailyData = getDailyData();

  const filteredCustomers = customers
    .filter(c => (c.debtBalance || 0) > 0)
    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm))
    .sort((a, b) => (b.debtBalance || 0) - (a.debtBalance || 0));

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">Đang truy xuất dữ liệu tài chính...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-slate-900 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-black border-l-8 border-brand-accent pl-4 uppercase tracking-tighter">Báo cáo tài chính</h1>
          <p className="text-slate-500 text-sm pl-4 font-medium italic">Thống kê doanh thu, công nợ & lợi nhuận dự tính</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
           <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
             <Download className="w-4 h-4" /> Xuất Excel
           </button>
           <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-brand-accent text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-brand-accent/30 transition-all active:scale-95">
             <TrendingUp className="w-4 h-4" /> Tổng kết ngày
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-sleek p-8 bg-slate-900 text-white relative overflow-hidden group hover:scale-[1.02] transition-all cursor-default shadow-2xl">
          <div className="relative z-10">
            <div className="text-[10px] items-center gap-2 font-black text-slate-500 uppercase tracking-widest mb-4 flex">
               <div className="p-1.5 bg-brand-accent/20 rounded-lg text-brand-accent"><DollarSign className="w-3 h-3" /></div>
               Tổng doanh thu
            </div>
            <div className="text-3xl font-black tracking-tighter text-white font-mono">{formatCurrency(totalRevenue)}</div>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-bold mt-4">
               <TrendingUp className="w-3 h-3" />
               <span>Tăng 15%</span>
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity">
             <TrendingUp className="w-32 h-32" />
          </div>
        </div>

        <div className="card-sleek p-8 bg-white border border-slate-200 group hover:border-emerald-500/30 transition-all shadow-xl">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
             <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600"><Wallet className="w-3 h-3" /></div>
             Lợi nhuận (Dự tính)
          </div>
          <div className="text-3xl font-black text-emerald-600 tracking-tighter font-mono">{formatCurrency(estimatedProfit)}</div>
          <div className="text-[10px] mt-4 text-slate-400 font-bold uppercase tracking-widest">Hiệu suất: ~{((estimatedProfit/totalRevenue)*100).toFixed(1)}%</div>
        </div>

        <div className="card-sleek p-8 bg-white border border-slate-200 group hover:border-blue-500/30 transition-all shadow-xl">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
             <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600"><CreditCard className="w-3 h-3" /></div>
             Tiền công dịch vụ
          </div>
          <div className="text-3xl font-black text-blue-600 tracking-tighter font-mono">{formatCurrency(totalServiceFee)}</div>
          <div className="text-[10px] mt-4 text-slate-400 font-bold uppercase tracking-widest">Doanh thu thợ sữa chữa</div>
        </div>

        <div className="card-sleek p-8 bg-red-50 border border-red-100 group hover:bg-red-100/50 transition-all shadow-xl">
          <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
             <div className="p-1.5 bg-red-100 rounded-lg text-red-600"><TrendingDown className="w-3 h-3" /></div>
             Nợ chưa thu hồi
          </div>
          <div className="text-3xl font-black text-red-600 tracking-tighter font-mono">{formatCurrency(totalDebt)}</div>
          <div className="flex items-center gap-1.5 text-[10px] mt-4 text-red-500 font-black uppercase tracking-widest">
             <Info className="w-3 h-3" />
             {customers.filter(c => (c.debtBalance || 0) > 0).length} khách đang nợ
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 card-sleek p-8 shadow-2xl border border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <div>
               <h3 className="font-black uppercase tracking-widest text-xs text-slate-900 mb-1">Hiệu suất tài chính tuần này</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">So sánh Doanh thu vs Công nợ mới</p>
            </div>
            <div className="flex gap-6">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-slate-900"></div>
                 <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Doanh thu</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                 <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Phát sinh nợ</span>
               </div>
            </div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                   dataKey="name" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{fontSize: 10, fontWeight: 900, fill: '#64748b'}} 
                   dy={10}
                />
                <YAxis hide />
                <Tooltip 
                   cursor={{ stroke: '#cbd5e1', strokeWidth: 2 }}
                   contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '16px' }}
                   itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                />
                <Area type="stepAfter" dataKey="revenue" stroke="#0f172a" fillOpacity={1} fill="url(#colorRev)" strokeWidth={4} />
                <Area type="monotone" dataKey="debt" stroke="#ef4444" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
           <div className="card-sleek flex-1 flex flex-col shadow-2xl border border-slate-100">
             <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                   <History className="w-4 h-4 text-brand-accent" />
                   Sổ nợ khách hàng
                </h3>
                <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full">HOT</span>
             </div>
             
             <div className="p-4 bg-white border-b border-slate-100">
                <div className="relative group">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-brand-accent transition-colors" />
                   <input 
                      type="text" 
                      placeholder="Tìm tên hoặc SĐT khách..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-xs font-bold outline-none focus:bg-slate-50 transition-all"
                   />
                </div>
             </div>

             <div className="flex-1 overflow-y-auto max-h-[500px]">
               <div className="divide-y divide-slate-50">
                 {filteredCustomers.map((customer) => (
                   <div key={customer.id} className="p-5 hover:bg-slate-50 transition-all flex justify-between items-center group cursor-pointer">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 text-xs shadow-inner group-hover:bg-white group-hover:text-brand-accent transition-all uppercase">
                           {customer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-black text-xs text-slate-900 group-hover:text-brand-accent transition-colors">{customer.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold font-mono tracking-tighter">{customer.phone}</div>
                        </div>
                     </div>
                     <div className="text-right">
                       <div className="font-black text-sm text-red-600">{formatCurrency(customer.debtBalance || 0)}</div>
                       <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Nợ tồn</div>
                     </div>
                   </div>
                 ))}
                 
                 {filteredCustomers.length === 0 && (
                   <div className="p-20 text-center text-slate-400">
                      <Wallet className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Không có dữ liệu nợ</p>
                   </div>
                 )}
               </div>
             </div>
             
             <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button className="w-full py-4 bg-white border-2 border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-white hover:border-brand-accent hover:text-brand-accent transition-all shadow-sm active:scale-95">
                  Quản lý thu chi ngoại kệ
                </button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
