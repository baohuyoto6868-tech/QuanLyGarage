import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from '../types';
import { User as UserIcon, Shield, Mail, BadgeCheck, X, Edit3, Trash2, Plus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const StaffManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (error: any) {
      alert("Lỗi khi cập nhật quyền: " + error.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-slate-500">Đang tải danh sách nhân viên...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-900">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-slate-900 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black border-l-8 border-brand-accent pl-3 uppercase tracking-tighter">Nhân sự</h1>
          <p className="text-slate-500 text-sm pl-3 font-medium italic">Phân quyền & Quản trị tài khoản</p>
        </div>
        <button className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 bg-brand-accent text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 shadow-xl shadow-brand-accent/30 transition-all active:scale-95">
          <Plus className="w-5 h-5" /> Mời nhân viên mới
        </button>
      </div>

      <div className="card-sleek p-2 lg:p-4 flex flex-col sm:flex-row gap-3 items-center bg-white/80 backdrop-blur-sm sticky top-16 z-20 shadow-md">
        <div className="w-full sm:flex-1 flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 group focus-within:border-brand-accent focus-within:bg-white transition-all">
          <Search className="w-4 h-4 text-slate-400 group-focus-within:text-brand-accent" />
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc email nhân viên..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full font-bold text-slate-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div key={user.id} className="card-sleek p-8 hover:border-brand-accent transition-all group relative overflow-hidden bg-white hover:shadow-2xl">
             <div className="flex items-center gap-5 mb-8">
                <div className="w-16 h-16 rounded-[1.5rem] bg-slate-100 flex items-center justify-center text-brand-accent font-black text-xl shadow-inner group-hover:bg-brand-accent group-hover:text-white transition-all transform group-hover:-rotate-6">
                  {user.name?.slice(0, 2).toUpperCase() || 'ST'}
                </div>
                <div className="flex-1 overflow-hidden">
                   <h3 className="font-black text-slate-900 truncate uppercase tracking-tighter text-lg">{user.name || 'Nhân viên mới'}</h3>
                   <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                      <Mail className="w-3 h-3 text-brand-accent" /> {user.email}
                   </div>
                </div>
             </div>

             <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-brand-accent" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vai trò hệ thống</span>
                   </div>
                   <select 
                     value={user.role}
                     onChange={(e) => handleRoleChange(user.id, e.target.value)}
                     className={cn(
                       "text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl outline-none transition-all cursor-pointer border-2",
                       user.role === 'admin' ? "bg-red-50 text-red-600 border-red-100" : "bg-blue-50 text-blue-600 border-blue-100"
                     )}
                   >
                      <option value="admin">Quản trị viên</option>
                      <option value="manager">Quản lý</option>
                      <option value="accountant">Kế toán</option>
                      <option value="sale">Bán hàng</option>
                      <option value="user">Kỹ thuật viên</option>
                   </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                   <div className="flex items-center gap-3">
                      <BadgeCheck className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</span>
                   </div>
                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" /> Trực tuyến
                   </span>
                </div>
             </div>

             <div className="mt-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                <button className="flex-1 py-3 px-4 bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-900 hover:text-white transition-all rounded-2xl shadow-sm">
                  Nhật ký hoạt động
                </button>
                <button className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-white hover:text-brand-accent border border-transparent hover:border-slate-200 transition-all rounded-2xl shadow-sm">
                  <Trash2 className="w-5 h-5" />
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

