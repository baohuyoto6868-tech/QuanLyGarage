import React from 'react';
import { Settings, Bell, Shield, Database, Globe, Palette, Info } from 'lucide-react';
import { motion } from 'motion/react';

export const SettingsManagement = () => {
  const sections = [
    {
      id: 'general',
      icon: Globe,
      title: 'Cài đặt chung',
      description: 'Ngôn ngữ, múi giờ và cấu hình cơ bản.',
      color: 'blue'
    },
    {
      id: 'notifications',
      icon: Bell,
      title: 'Thông báo',
      description: 'Quản lý cách nhận thông báo từ hệ thống.',
      color: 'purple'
    },
    {
      id: 'security',
      icon: Shield,
      title: 'Bảo mật',
      description: 'Mật khẩu, xác thực 2 lớp và quyền truy cập.',
      color: 'red'
    },
    {
      id: 'database',
      icon: Database,
      title: 'Dữ liệu',
      description: 'Sao lưu, khôi phục và xuất dữ liệu hệ thống.',
      color: 'emerald'
    },
    {
      id: 'appearance',
      icon: Palette,
      title: 'Giao diện',
      description: 'Tùy chỉnh màu sắc và chế độ sáng/tối.',
      color: 'orange'
    },
    {
      id: 'about',
      icon: Info,
      title: 'Thông tin',
      description: 'Phiên bản phần mềm và thông tin hỗ trợ.',
      color: 'slate'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-900 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black border-l-8 border-brand-accent pl-3 uppercase tracking-tighter">Cài đặt hệ thống</h1>
          <p className="text-slate-500 text-sm pl-3 font-medium italic">Tùy chỉnh Garage ERP theo nhu cầu của bạn</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={section.id}
              className="card-sleek p-8 text-left bg-white hover:border-brand-accent transition-all group relative overflow-hidden"
            >
              <div className="flex items-center gap-5">
                <div className={`p-4 rounded-2xl bg-${section.color}-100 group-hover:bg-brand-accent transition-all`}>
                  <Icon className={`w-6 h-6 text-${section.color}-600 group-hover:text-white transition-all`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-slate-900 uppercase tracking-tighter text-lg">{section.title}</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">{section.description}</p>
                </div>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-all">
                 <Settings className="w-12 h-12 transform rotate-45" />
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="card-sleek p-8 bg-slate-900 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-xl font-black uppercase tracking-tighter mb-2">Hỗ trợ kỹ thuật</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-lg">Nếu bạn gặp bất kỳ vấn đề gì về hệ thống hoặc cần tính năng mới, vui lòng liên hệ đội ngũ phát triển tại AI Studio.</p>
          <div className="flex gap-4">
            <button className="px-6 py-3 bg-white text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-brand-accent hover:text-white transition-all shadow-xl shadow-brand-accent/30">Gửi yêu cầu</button>
            <button className="px-6 py-3 bg-slate-800 text-slate-300 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all">Tài liệu hướng dẫn</button>
          </div>
        </div>
        <div className="absolute -bottom-10 -right-10 opacity-10">
          <Settings className="w-64 h-64 animate-spin-slow" />
        </div>
      </div>
    </div>
  );
};
