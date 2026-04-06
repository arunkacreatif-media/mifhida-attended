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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.WALI_KELAS, UserRole.KEPALA_SEKOLAH] },
    { id: 'students', label: 'Data Siswa', icon: Users, roles: [UserRole.ADMIN, UserRole.WALI_KELAS] },
    { id: 'scanner', label: 'Scan Absensi', icon: Camera, roles: [UserRole.ADMIN, UserRole.WALI_KELAS] },
    { id: 'idcard', label: 'Kartu Siswa', icon: CreditCard, roles: [UserRole.ADMIN] },
    { id: 'reports', label: 'Rekapitulasi', icon: FileText, roles: [UserRole.ADMIN, UserRole.KEPALA_SEKOLAH] },
    { id: 'about', label: 'Tentang', icon: Info, roles: [UserRole.ADMIN, UserRole.WALI_KELAS, UserRole.KEPALA_SEKOLAH] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-emerald-900 text-white flex flex-col shadow-xl z-20"
      >
        <div className="p-6 flex items-center gap-3 border-b border-emerald-800/50">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg overflow-hidden p-1">
            <img 
              src={LOGOS.SCHOOL} 
              alt="School Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h1 className="font-bold text-lg leading-tight">Miftahul Hidayah</h1>
              <p className="text-emerald-300 text-xs uppercase tracking-widest font-medium">Absensi Digital</p>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {filteredMenu.map(item => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group ${
                activePage === item.id 
                  ? 'bg-gold text-emerald-900 shadow-md font-semibold' 
                  : 'hover:bg-emerald-800 text-emerald-100'
              }`}
            >
              <item.icon size={22} className={activePage === item.id ? 'text-emerald-900' : 'text-emerald-400 group-hover:text-white'} />
              {isSidebarOpen && <span>{item.label}</span>}
              {isSidebarOpen && activePage === item.id && (
                <motion.div layoutId="active" className="ml-auto">
                  <ChevronRight size={16} />
                </motion.div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-emerald-800/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-red-500/20 text-red-400 transition-colors"
          >
            <LogOut size={22} />
            {isSidebarOpen && <span>Keluar</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="text-xl font-bold text-gray-800 capitalize">
              {menuItems.find(i => i.id === activePage)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-full border border-gray-100">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800 leading-none">{user.nama}</p>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-1">{user.role.replace('_', ' ')}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <UserCircle className="text-emerald-700" size={24} />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto"
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
    </div>
  );
}
