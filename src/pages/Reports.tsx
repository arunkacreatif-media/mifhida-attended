/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Printer,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../services/api';
import { ATTENDANCE_STATUS, KELAS, LOGOS } from '../lib/constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports({ user }: { user: any }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterKelas, setFilterKelas] = useState('ALL');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchLogs();
  }, [user]);

  const fetchLogs = async () => {
    setLoading(true);
    const data = await api.getAbsensiLogs(user);
    setLogs(data);
    setLoading(false);
  };

  const allKelas = Object.values(KELAS).flat();

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.idSiswa.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.nama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || log.status === filterStatus;
    const matchesKelas = filterKelas === 'ALL' || log.kelas === filterKelas;
    const matchesDate = log.tanggal === filterDate;
    return matchesSearch && matchesStatus && matchesKelas && matchesDate;
  });

  const exportToPDF = async () => {
    if (filteredLogs.length === 0) return;
    setIsExporting(true);

    try {
      const doc = new jsPDF();
      
      // Add Title
      doc.setFontSize(18);
      doc.setTextColor(6, 95, 70); // Emerald 800
      doc.text('Laporan Absensi Digital', 14, 22);
      
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text('Yayasan Pendidikan Islam Miftahul Hidayah', 14, 30);
      
      // Add Filter Info
      doc.setFontSize(10);
      doc.text(`Tanggal: ${filterDate}`, 14, 40);
      doc.text(`Kelas: ${filterKelas === 'ALL' ? 'Semua Kelas' : filterKelas}`, 14, 45);
      doc.text(`Status: ${filterStatus === 'ALL' ? 'Semua Status' : filterStatus}`, 14, 50);

      const tableHeaders = [['No', 'ID Siswa', 'Nama', 'Kelas', 'Jam', 'Status', 'Keterangan']];
      const tableData = filteredLogs.map((log, index) => [
        index + 1,
        log.idSiswa,
        log.nama,
        log.kelas,
        log.jam,
        log.status,
        log.keterangan || '-'
      ]);

      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: 60,
        styles: { font: 'helvetica', fontSize: 9 },
        headStyles: { fillColor: [6, 95, 70], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [240, 253, 244] },
      });

      doc.save(`Laporan_Absensi_${filterDate}_${filterKelas}.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari ID Siswa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-[1.5rem] focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
            />
          </div>
          <div className="relative">
            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="pl-12 pr-6 py-4 bg-white border border-gray-200 rounded-[1.5rem] focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm font-bold text-gray-600"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-6 py-4 bg-white border border-gray-200 rounded-[1.5rem] focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm font-bold text-gray-600"
          >
            <option value="ALL">Semua Status</option>
            {Object.values(ATTENDANCE_STATUS).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="px-6 py-4 bg-white border border-gray-200 rounded-[1.5rem] focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm font-bold text-gray-600"
          >
            <option value="ALL">Semua Kelas</option>
            {allKelas.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportToPDF}
            disabled={filteredLogs.length === 0 || isExporting}
            className="p-4 bg-white text-emerald-700 rounded-[1.5rem] border border-emerald-100 hover:bg-emerald-50 transition-all shadow-sm disabled:opacity-50"
            title="Cetak Laporan"
          >
            {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Printer size={20} />}
          </button>
          <button
            onClick={exportToPDF}
            disabled={filteredLogs.length === 0 || isExporting}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-emerald-800 text-white rounded-[1.5rem] font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 active:scale-95 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
            Export PDF
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-caption font-black text-emerald-800 uppercase tracking-widest">Hadir Tepat Waktu</p>
            <h4 className="text-[20px] font-black text-emerald-900">{filteredLogs.filter(l => l.status === 'HADIR').length}</h4>
          </div>
        </div>
        <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-caption font-black text-amber-800 uppercase tracking-widest">Terlambat</p>
            <h4 className="text-[20px] font-black text-amber-900">{filteredLogs.filter(l => l.status === 'TERLAMBAT').length}</h4>
          </div>
        </div>
        <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-caption font-black text-red-800 uppercase tracking-widest">Tidak Hadir</p>
            <h4 className="text-[20px] font-black text-red-900">0</h4>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-caption font-black text-gray-400 uppercase tracking-widest">Siswa</th>
                <th className="px-8 py-5 text-caption font-black text-gray-400 uppercase tracking-widest">ID & Kelas</th>
                <th className="px-8 py-5 text-caption font-black text-gray-400 uppercase tracking-widest">Tanggal</th>
                <th className="px-8 py-5 text-caption font-black text-gray-400 uppercase tracking-widest">Jam</th>
                <th className="px-8 py-5 text-caption font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-caption font-black text-gray-400 uppercase tracking-widest">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="px-8 py-20 text-center text-gray-400">Memuat data...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-20 text-center text-gray-400">Tidak ada data absensi untuk tanggal ini</td></tr>
              ) : filteredLogs.map((log, index) => (
                <tr key={`${log.idSiswa}-${log.jam}`} className="hover:bg-emerald-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700 font-black text-xs">
                        {log.nama.charAt(0)}
                      </div>
                      <span className="font-bold text-gray-900 text-body">{log.nama}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-caption font-black text-gray-700">{log.idSiswa}</span>
                      <span className="text-caption font-bold text-gray-400">{log.kelas}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-body font-bold text-gray-600">{log.tanggal}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-body font-black text-emerald-700">{log.jam}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`text-caption font-black px-3 py-1 rounded-full uppercase tracking-widest ${log.status === 'HADIR' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-body text-gray-400 italic">{log.keterangan || '-'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-8 py-5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500 font-medium">Menampilkan {filteredLogs.length} data</p>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-white rounded-lg border border-gray-200 text-gray-400 disabled:opacity-50" disabled><ChevronLeft size={18} /></button>
            <button className="p-2 hover:bg-white rounded-lg border border-gray-200 text-gray-400 disabled:opacity-50" disabled><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
