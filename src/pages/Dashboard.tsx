/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Calendar as CalendarIcon,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { api } from '../services/api';
import { UserRole } from '../lib/constants';

export default function Dashboard({ user }: { user: any }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const data = await api.getDashboardStats();
      setStats(data);
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800"></div></div>;

  const chartData = [
    { name: 'Hadir', value: stats.hadirToday, color: '#059669' },
    { name: 'Terlambat', value: stats.terlambatToday, color: '#d97706' },
    { name: 'Tidak Hadir', value: stats.tidakHadirToday, color: '#dc2626' },
  ];

  const weeklyData = [
    { day: 'Sen', hadir: 45, terlambat: 5 },
    { day: 'Sel', hadir: 48, terlambat: 2 },
    { day: 'Rab', hadir: 42, terlambat: 8 },
    { day: 'Kam', hadir: 46, terlambat: 4 },
    { day: 'Jum', hadir: 40, terlambat: 10 },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-emerald-800 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2">Assalamu'alaikum, {user.nama.split(' ')[0]}!</h1>
          <p className="text-emerald-100 opacity-90 max-w-md">
            Selamat datang kembali di sistem monitoring absensi Yayasan Miftahul Hidayah. 
            Hari ini adalah {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
          </p>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 -skew-x-12 transform translate-x-1/2 pointer-events-none"></div>
        <TrendingUp className="absolute right-12 bottom-8 text-white/20" size={120} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Siswa" 
          value={stats.totalSiswa} 
          icon={Users} 
          color="bg-blue-500" 
          trend="+2%" 
          trendUp={true}
        />
        <StatCard 
          title="Hadir Tepat Waktu" 
          value={stats.hadirToday} 
          icon={CheckCircle2} 
          color="bg-emerald-500" 
          trend="+12%" 
          trendUp={true}
        />
        <StatCard 
          title="Terlambat" 
          value={stats.terlambatToday} 
          icon={Clock} 
          color="bg-amber-500" 
          trend="-5%" 
          trendUp={false}
        />
        <StatCard 
          title="Tidak Hadir" 
          value={stats.tidakHadirToday} 
          icon={AlertTriangle} 
          color="bg-red-500" 
          trend="+1%" 
          trendUp={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-gray-900">Tren Kehadiran Mingguan</h3>
              <p className="text-gray-500 text-sm">Statistik kehadiran 5 hari terakhir</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 text-sm font-bold text-gray-600">
              <CalendarIcon size={16} />
              Minggu Ini
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="hadir" fill="#059669" radius={[6, 6, 0, 0]} barSize={30} />
                <Bar dataKey="terlambat" fill="#d97706" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-xl font-black text-gray-900 mb-2">Distribusi Hari Ini</h3>
          <p className="text-gray-500 text-sm mb-8">Persentase status kehadiran</p>
          
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4 mt-8">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm font-bold text-gray-600">{item.name}</span>
                </div>
                <span className="text-sm font-black text-gray-900">{Math.round((item.value / stats.totalSiswa) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend, trendUp }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-4 rounded-2xl ${color} text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={24} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-black px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">{title}</p>
        <h4 className="text-3xl font-black text-gray-900">{value}</h4>
      </div>
    </div>
  );
}
