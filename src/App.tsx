/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  QrCode, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  UserCircle,
  Bell,
  Settings,
  FileText,
  CreditCard,
  Camera,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole, COLORS, LOGOS } from './lib/constants';
import { api } from './services/api';

// Pages
// Vercel Integration Ready
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Scanner from './pages/Scanner';
import IDCard from './pages/IDCard';
import Reports from './pages/Reports';
import About from './pages/About';

export default function App() {
  const [user, setUser] = useState<{ email: string; role: UserRole; nama: string } | null>(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Check session
    const savedUser = localStorage.getItem('MH_USER');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setAuthReady(true);
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('MH_USER', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('MH_USER');
  };

  if (!isAuthReady) return null;
  if (!user) return <Login onLogin={handleLogin} />;

  const menuItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.WALI_KELAS, UserRole.KEPALA_SEKOLAH] },
    { id: 'students', label: 'Siswa', icon: Users, roles: [UserRole.ADMIN, UserRole.WALI_KELAS] },
    { id: 'scanner', label: 'Absensi', icon: Camera, roles: [UserRole.ADMIN, UserRole.WALI_KELAS] },
    { id: 'idcard', label: 'Kartu', icon: CreditCard, roles: [UserRole.ADMIN] },
    { id: 'reports', label: 'Rekap', icon: FileText, roles: [UserRole.ADMIN, UserRole.KEPALA_SEKOLAH] },
    { id: 'about', label: 'Tentang', icon: Info, roles: [UserRole.ADMIN, UserRole.WALI_KELAS, UserRole.KEPALA_SEKOLAH] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      {/* Top App Bar */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-800 rounded-lg flex items-center justify-center shadow-md overflow-hidden p-1">
            <img 
              src={LOGOS.SCHOOL} 
              alt="Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="font-black text-[20px] text-emerald-900 leading-tight">MifHida</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-caption font-black text-gray-800 leading-none">{user.nama}</p>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">
              {user.role === UserRole.WALI_KELAS ? `Wali Kelas ${user.kelas_diampu}` : user.role.replace('_', ' ')}
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 custom-scrollbar">
        <div className="max-w-md mx-auto px-4 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {activePage === 'dashboard' && <Dashboard user={user} />}
              {activePage === 'students' && <Students user={user} />}
              {activePage === 'scanner' && <Scanner user={user} />}
              {activePage === 'idcard' && <IDCard user={user} />}
              {activePage === 'reports' && <Reports user={user} />}
              {activePage === 'about' && <About />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-2 z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {filteredMenu.map(item => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-300 relative ${
              activePage === item.id ? 'text-emerald-800' : 'text-gray-400'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all duration-300 ${
              activePage === item.id ? 'bg-emerald-50' : 'bg-transparent'
            }`}>
              <item.icon size={22} strokeWidth={activePage === item.id ? 2.5 : 2} />
            </div>
            <span className={`text-caption font-bold transition-all duration-300 ${
              activePage === item.id ? 'opacity-100 scale-100' : 'opacity-70 scale-95'
            }`}>
              {item.label}
            </span>
            {activePage === item.id && (
              <motion.div 
                layoutId="nav-indicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-emerald-800 rounded-b-full"
              />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
