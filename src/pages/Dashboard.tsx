/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Camera,
  FileText,
  LayoutDashboard
} from 'lucide-react';
import { api } from '../services/api';
import { UserRole } from '../lib/constants';

export default function Dashboard({ user, onNavigate }: { user: any, onNavigate: (page: string) => void }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const data = await api.getDashboardStats(user);
      setStats(data);
      setLoading(false);
    };
    fetchStats();
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-emerald-800 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-[16px] font-black mb-1 opacity-90">Assalamu'alaikum,</h2>
          <p className="text-[18px] font-black text-gold leading-tight">{user.nama}</p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold backdrop-blur-sm">
            <div className="w-2 h-2 bg-gold rounded-full animate-pulse"></div>
            {user.role === UserRole.WALI_KELAS ? `Wali Kelas ${user.kelas_diampu}` : user.role.replace('_', ' ')}
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          label="Total Siswa" 
          value={stats.totalSiswa} 
          icon={Users} 
          color="bg-blue-50 text-blue-600" 
          subLabel="Terdaftar"
        />
        <StatCard 
          label="Hadir" 
          value={stats.hadirToday} 
          icon={CheckCircle} 
          color="bg-emerald-50 text-emerald-600" 
          subLabel="Hari ini"
        />
        <StatCard 
          label="Terlambat" 
          value={stats.terlambatToday} 
          icon={Clock} 
          color="bg-orange-50 text-orange-600" 
          subLabel="Hari ini"
        />
        <StatCard 
          label="Absen" 
          value={stats.tidakHadirToday} 
          icon={AlertCircle} 
          color="bg-red-50 text-red-600" 
          subLabel="Belum absen"
        />
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-black text-gray-800">Aksi Cepat</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <QuickAction icon={Camera} label="Scan" color="bg-emerald-800" onClick={() => onNavigate('scanner')} />
          <QuickAction icon={Users} label="Siswa" color="bg-blue-600" onClick={() => onNavigate('students')} />
          <QuickAction icon={FileText} label="Laporan" color="bg-purple-600" onClick={() => onNavigate('reports')} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, subLabel }: any) {
  return (
    <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col gap-3">
      <div className={`w-10 h-10 ${color} rounded-2xl flex items-center justify-center`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-caption font-black text-gray-400 uppercase tracking-wider">{label}</p>
        <h4 className="text-[20px] font-black text-gray-800">{value}</h4>
        <p className="text-caption text-gray-400 mt-0.5">{subLabel}</p>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, color, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-2 group"
    >
      <div className={`w-14 h-14 ${color} text-white rounded-2xl flex items-center justify-center shadow-lg group-active:scale-90 transition-transform`}>
        <Icon size={24} />
      </div>
      <span className="text-caption font-black text-gray-600">{label}</span>
    </button>
  );
}
