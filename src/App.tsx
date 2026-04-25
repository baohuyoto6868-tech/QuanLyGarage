import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { cn, formatCurrency, formatDateTime } from './lib/utils';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  Car, 
  Package, 
  BadgeDollarSign, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Factory,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Order, Product, Customer } from './types';
import { OrderManagement } from './components/OrderManagement';
import { InventoryManagement } from './components/InventoryManagement';
import { CustomerManagement } from './components/CustomerManagement';
import { VehicleManagement } from './components/VehicleManagement';
import { FinanceManagement } from './components/FinanceManagement';
import { SupplierManagement } from './components/SupplierManagement';
import { StaffManagement } from './components/StaffManagement';
import { SettingsManagement } from './components/SettingsManagement';
import { OrderService } from './services/orderService';

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab, user, isOpen, setIsOpen }: { activeTab: string, setActiveTab: (tab: string) => void, user: User | null, isOpen: boolean, setIsOpen: (o: boolean) => void }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'orders', label: 'Lệnh sửa chữa', icon: ClipboardList },
    { id: 'customers', label: 'Khách hàng', icon: Users },
    { id: 'vehicles', label: 'Quản lý xe', icon: Car },
    { id: 'inventory', label: 'Kho phụ tùng', icon: Package },
    { id: 'suppliers', label: 'Nhà cung cấp', icon: Factory },
    { id: 'finance', label: 'Tài chính', icon: BadgeDollarSign },
    { id: 'staff', label: 'Nhân viên & Phân quyền', icon: UserIcon },
    { id: 'settings', label: 'Thiết lập hệ thống', icon: Settings },
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    if (window.innerWidth < 1024) setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 flex flex-col h-full bg-brand-sidebar text-slate-300 w-[260px] flex-shrink-0 transition-transform duration-300 transform border-r border-slate-800",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 h-16 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl text-white tracking-widest uppercase">
              GARAGE <span className="text-brand-accent">ERP</span>
            </span>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 mt-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={cn(
                  "sidebar-nav-item w-full text-left",
                  isActive && "active"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto p-6 border-t border-slate-700 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
          Phiên bản 2.4.0 (Production)
        </div>

        <div className="p-4 border-t border-slate-700">
          <button 
            onClick={() => signOut(auth)}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
};

const Header = ({ user, onMenuClick }: { user: User | null, onMenuClick: () => void }) => {
  return (
    <header className="h-16 bg-white border-b border-brand-border px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100 shadow-sm bg-white"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-sm lg:text-lg font-bold text-slate-900 border-l-4 border-brand-accent pl-3 truncate max-w-[200px] lg:max-w-none">
          Quản Lý Garage
        </h1>
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        <div className="relative group hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-accent transition-colors" />
          <input 
            type="text" 
            placeholder="Tìm biển số, SĐT, mã đơn..." 
            className="bg-slate-50 border border-brand-border outline-none text-sm w-64 pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 lg:gap-3 lg:border-l border-slate-100 lg:pl-6 ml-2">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-bold text-slate-900">{user?.name || 'Quản trị viên'}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              {user?.role === 'admin' ? 'Quản trị (Admin)' : 'Kỹ thuật viên'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-brand-accent flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-brand-accent/20">
             {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
          </div>
        </div>
      </div>
    </header>
  );
}

const StatCard = ({ title, value, subValue, icon: Icon, color, trend, trendColor }: any) => {
  return (
    <div className="card-sleek p-6">
      <div className="flex flex-col">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{title}</div>
        <div className="text-2xl font-bold text-slate-900 leading-none">{value}</div>
        <div className="flex items-center mt-3">
          {trend && (
            <div className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center", trendColor || "bg-emerald-100 text-emerald-700")}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </div>
          )}
          {subValue && <span className="text-slate-500 text-[11px] font-medium ml-2">{subValue}</span>}
        </div>
      </div>
    </div>
  );
};

const DashboardView = ({ user }: { user: User | null }) => {
  const [stats, setStats] = useState({
    revenueToday: 0,
    totalOrdersToday: 0,
    activeRepairs: 0,
    lowStockItems: 0,
    totalDebt: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Basic stats listeners
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    // Today's orders & revenue
    const qToday = query(collection(db, 'orders'), where('createdAt', '>=', todayStr));
    const unsubOrders = onSnapshot(qToday, (snap) => {
      let rev = 0;
      let repairCount = 0;
      snap.docs.forEach(d => {
        const data = d.data() as Order;
        if (data.status === 'completed') rev += data.finalAmount || 0;
        if (data.status === 'repairing') repairCount++;
      });
      setStats(prev => ({ ...prev, revenueToday: rev, totalOrdersToday: snap.size, activeRepairs: repairCount }));
    });

    // Recent orders for the table
    const qRecent = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5));
    const unsubRecent = onSnapshot(qRecent, (snap) => {
      setRecentOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    });

    // Low stock alert
    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      const low = snap.docs.filter(d => {
        const p = d.data();
        return p.stockQuantity <= (p.minStockAlert || 5);
      }).length;
      setStats(prev => ({ ...prev, lowStockItems: low }));
    });

    // Total Debt (from customers)
    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snap) => {
      const totalDebt = snap.docs.reduce((acc, d) => acc + (d.data().debtBalance || 0), 0);
      setStats(prev => ({ ...prev, totalDebt }));
    });

    return () => {
      unsubOrders();
      unsubRecent();
      unsubProducts();
      unsubCustomers();
    };
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Doanh thu hôm nay" 
          value={formatCurrency(stats.revenueToday)} 
          subValue="Đã quyết toán"
        />
        <StatCard 
          title="Lệnh sửa chữa (Hôm nay)" 
          value={stats.totalOrdersToday} 
          subValue={`Đang sửa: ${stats.activeRepairs}`}
        />
        <StatCard 
          title="Cảnh báo tồn kho" 
          value={stats.lowStockItems} 
          trendColor={stats.lowStockItems > 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}
          subValue="Phụ tùng dưới mức tối thiểu"
        />
        <StatCard 
          title="Tổng nợ phải thu" 
          value={formatCurrency(stats.totalDebt)} 
          subValue="Từ tất cả khách hàng"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-sleek overflow-hidden flex flex-col">
          <div className="p-4 border-b border-brand-border flex justify-between items-center bg-slate-50">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Hoạt động gần đây</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-display">
              <thead className="bg-slate-50 border-b border-brand-border">
                <tr>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Mã lệnh</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Biển số</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Khách hàng</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Trạng thái</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Tổng tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-sm">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{order.code}</td>
                    <td className="px-6 py-4 font-mono text-xs">{order.vehiclePlate}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{order.customerName}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "badge-sleek",
                        order.status === 'completed' && "bg-emerald-100 text-emerald-800",
                        order.status === 'repairing' && "bg-blue-100 text-blue-800",
                        order.status === 'pending' && "bg-amber-100 text-amber-800",
                        order.status === 'cancelled' && "bg-slate-100 text-slate-500",
                      )}>
                        {order.status === 'completed' ? 'Hoàn tất' : 
                         order.status === 'repairing' ? 'Đang sửa' : 
                         order.status === 'pending' ? 'Chờ xử lý' : 'Đã hủy'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(order.finalAmount)}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400">Chưa có dữ liệu giao dịch.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-sleek p-5 bg-blue-50/50 border-brand-accent/20">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Ghi chú vận hành</h3>
          <ul className="space-y-3">
             <li className="flex gap-2 text-xs font-medium text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-accent mt-1.5 flex-shrink-0"></div>
                Ưu tiên hoàn thiện các lệnh "Đang sửa" trong ngày.
             </li>
             <li className="flex gap-2 text-xs font-medium text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></div>
                Kiểm tra tồn kho các mặt hàng có cảnh báo đỏ.
             </li>
             <li className="flex gap-2 text-xs font-medium text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></div>
                Đối soát công nợ khách hàng vào cuối tuần.
             </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// --- Seed Data Helper ---
const seedData = async (userId: string) => {
  const productsCheck = await getDocs(collection(db, 'products'));
  if (productsCheck.empty) {
    const products = [
      { name: 'Dầu nhớt Castrol 4L', sku: 'OIL-CAS-4L', priceImport: 450000, priceSale: 650000, stockQuantity: 20, minStockAlert: 5, isConsignment: false },
      { name: 'Lọc gió động cơ Toyota', sku: 'FILTER-TOY-01', priceImport: 120000, priceSale: 250000, stockQuantity: 15, minStockAlert: 3, isConsignment: false },
      { name: 'Má phanh trước Honda CR-V', sku: 'BRAKE-HON-02', priceImport: 850000, priceSale: 1200000, stockQuantity: 8, minStockAlert: 2, isConsignment: false },
      { name: 'Lốp Michelin Primacy 4', sku: 'TYRE-MIC-215', priceImport: 2200000, priceSale: 2800000, stockQuantity: 4, minStockAlert: 4, isConsignment: true },
    ];
    for (const p of products) {
      await setDoc(doc(collection(db, 'products')), { ...p, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }

    const customers = [
      { name: 'Nguyễn Văn A', phone: '0901234567', address: '123 Đường Láng, Hà Nội', notes: 'Khách quen, xe Camry' },
      { name: 'Trần Thị B', phone: '0912345678', address: '456 Lê Lợi, TP.HCM', notes: 'Cần sửa điều hòa' },
    ];
    for (const c of customers) {
      await setDoc(doc(collection(db, 'customers')), { ...c, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    
    // Create a sample order
    const sampleCustomer = await OrderService.findCustomerByPhone('0901234567');
    if (sampleCustomer) {
      await OrderService.createOrder(
        { id: sampleCustomer.id },
        { licensePlate: '30A-111.22', vin: 'VN123456', engineNumber: 'EG999', mileage: 45000 },
        [
          { serviceName: 'Thay dầu động cơ', quantity: 1, price: 200000 },
          { serviceName: 'Dầu nhớt Castrol 4L', productId: (await getDocs(query(collection(db, 'products'), limit(1)))).docs[0].id, quantity: 1, price: 650000 }
        ],
        { 
          code: 'DH-2024001', 
          totalAmount: 850000, 
          discountAmount: 50000, 
          insuranceAmount: 0, 
          createdBy: userId,
          status: 'pending'
        }
      );
    }
  }
};

// --- Main App Component ---

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsSidebarOpen(true);
      else setIsSidebarOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          let userDoc;
          
          try {
            userDoc = await getDoc(userRef);
          } catch (e: any) {
            // If permission denied, it's likely the document doesn't exist yet and rules are strict
            if (e.code === 'permission-denied') {
              console.log("Permission denied for user fetch, assuming new user.");
            } else {
              throw e;
            }
          }

          let userData: User;
          if (userDoc && userDoc.exists()) {
            userData = userDoc.data() as User;
            setCurrentUser(userData);
          } else {
            userData = {
              id: user.uid,
              name: user.displayName || 'Nhân viên mới',
              email: user.email || '',
              role: 'admin',
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await setDoc(userRef, userData);
            setCurrentUser(userData);
          }
          // Run seed (will check if data exists first)
          await seedData(user.uid);
        } catch (error) {
          console.error("Error in user setup flow:", error);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center ring-inset">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-10">
            <div className="flex justify-center mb-8">
              <div className="bg-brand-accent p-3 rounded-2xl shadow-xl shadow-brand-accent/30">
                <Car className="text-white w-8 h-8" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-center text-slate-900 uppercase tracking-widest mb-2">
              GARAGE <span className="text-brand-accent">ERP</span>
            </h2>
            <p className="text-center text-slate-500 text-sm mb-8 font-medium">Hệ thống quản lý Garage chuyên nghiệp</p>
            
            <div className="space-y-4">
              <button 
                onClick={handleLogin}
                className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 hover:border-brand-accent/30 transition-all shadow-sm active:scale-[0.98]"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Đăng nhập với Google
              </button>
              
              <div className="relative py-4 flex items-center">
                <div className="flex-1 border-t border-slate-100"></div>
                <span className="px-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Hoặc sử dụng tài khoản</span>
                <div className="flex-1 border-t border-slate-100"></div>
              </div>

              <div className="space-y-4">
                 <input type="text" placeholder="Tên đăng nhập (Email)" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all text-sm font-medium" />
                 <input type="password" placeholder="Mật khẩu" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all text-sm font-medium" />
                 <button className="w-full py-4 bg-brand-accent text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-brand-accent/20 hover:bg-blue-700 transition-all active:scale-[0.98]">
                    Vào hệ thống
                 </button>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 p-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 font-medium">
              Chưa có tài khoản? <a href="#" className="text-brand-accent font-bold hover:underline">Liên hệ quản trị</a>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden font-sans">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={currentUser} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={currentUser} onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-100/50">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div 
                  key="dashboard"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  <DashboardView user={currentUser} />
                </motion.div>
              )}

            {activeTab === 'orders' && (
              <motion.div 
                key="orders"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <OrderManagement userId={currentUser?.id || ''} />
              </motion.div>
            )}

            {activeTab === 'vehicles' && (
              <motion.div 
                key="vehicles"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <VehicleManagement userId={currentUser?.id || ''} />
              </motion.div>
            )}

            {activeTab === 'inventory' && (
              <motion.div 
                key="inventory"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <InventoryManagement userId={currentUser?.id || ''} />
              </motion.div>
            )}

            {activeTab === 'finance' && (
              <motion.div 
                key="finance"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <FinanceManagement />
              </motion.div>
            )}

            {activeTab === 'suppliers' && (
              <motion.div 
                key="suppliers"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <SupplierManagement />
              </motion.div>
            )}

            {activeTab === 'staff' && (
              <motion.div 
                key="staff"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <StaffManagement />
              </motion.div>
            )}

            {activeTab === 'customers' && (
              <motion.div 
                key="customers"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <CustomerManagement userId={currentUser?.id || ''} />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <SettingsManagement />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      </div>
    </div>
  );
}
