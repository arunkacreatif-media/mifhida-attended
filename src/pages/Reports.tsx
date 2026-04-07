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
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterKelas, setFilterKelas] = useState('ALL');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().substring(0, 7));
  const [reportType, setReportType] = useState<'DAILY' | 'MONTHLY'>('DAILY');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [logsData, studentsData] = await Promise.all([
      api.getAbsensiLogs(user),
      api.getSiswa(user)
    ]);
    setLogs(logsData);
    setStudents(studentsData);
    setLoading(false);
  };

  const allKelas = Object.values(KELAS).flat();

  const filteredLogs = logs.filter(log => {
    const idSiswa = (log.idsiswa || '').toString();
    const nama = (log.nama || '').toString();
    
    const matchesSearch = idSiswa.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          nama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || log.status === filterStatus;
    const matchesKelas = filterKelas === 'ALL' || log.kelas === filterKelas;
    
    const matchesTime = reportType === 'DAILY' 
      ? log.tanggal === filterDate 
      : log.tanggal.startsWith(filterMonth);

    return matchesSearch && matchesStatus && matchesKelas && matchesTime;
  });

  // Monthly Summary Logic
  const monthlySummary = students
    .filter(s => filterKelas === 'ALL' || s.kelas === filterKelas)
    .map(s => {
      const studentLogs = logs.filter(l => l.idsiswa === s.id && l.tanggal.startsWith(filterMonth));
      return {
        id: s.id,
        nama: s.nama,
        kelas: s.kelas,
        hadir: studentLogs.filter(l => l.status === 'HADIR').length,
        terlambat: studentLogs.filter(l => l.status === 'TERLAMBAT').length,
        sakit: studentLogs.filter(l => l.status === 'SAKIT').length,
        izin: studentLogs.filter(l => l.status === 'IZIN').length,
        alfa: studentLogs.filter(l => l.status === 'ALFA').length,
      };
    });

  const exportToPDF = async () => {
    if (filteredLogs.length === 0 && reportType === 'DAILY') return;
    setIsExporting(true);

    try {
      const doc = new jsPDF();
      const title = reportType === 'DAILY' ? 'Laporan Absensi Harian' : 'Rekap Absensi Bulanan';
      
      doc.setFontSize(18);
      doc.setTextColor(6, 95, 70);
      doc.text(title, 14, 22);
      
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text('Yayasan Pendidikan Islam Miftahul Hidayah', 14, 30);
      
      doc.setFontSize(10);
      if (reportType === 'DAILY') {
        doc.text(`Tanggal: ${filterDate}`, 14, 40);
      } else {
        doc.text(`Bulan: ${filterMonth}`, 14, 40);
      }
      doc.text(`Kelas: ${filterKelas === 'ALL' ? 'Semua Kelas' : filterKelas}`, 14, 45);

      if (reportType === 'DAILY') {
        const tableHeaders = [['No', 'ID Siswa', 'Nama', 'Kelas', 'Jam', 'Status', 'Keterangan']];
        const tableData = filteredLogs.map((log, index) => [
          index + 1,
          log.idsiswa || '-',
          log.nama || '-',
          log.kelas || '-',
          log.jam || '-',
          log.status || '-',
          log.keterangan || '-'
        ]);

        autoTable(doc, {
          head: tableHeaders,
          body: tableData,
          startY: 55,
          styles: { font: 'helvetica', fontSize: 9 },
          headStyles: { fillColor: [6, 95, 70], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [240, 253, 244] },
        });
      } else {
        const tableHeaders = [['No', 'ID', 'Nama', 'H', 'T', 'S', 'I', 'A']];
        const tableData = monthlySummary.map((s, index) => [
          index + 1, s.id, s.nama, s.hadir, s.terlambat, s.sakit, s.izin, s.alfa
        ]);

        autoTable(doc, {
          head: tableHeaders,
          body: tableData,
          startY: 55,
          styles: { font: 'helvetica', fontSize: 9 },
          headStyles: { fillColor: [6, 95, 70], textColor: [255, 255, 255] },
        });
      }

      doc.save(`${title}_${reportType === 'DAILY' ? filterDate : filterMonth}.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Report Type Tabs */}
      <div className="flex bg-gray-100 p-1.5 rounded-[1.5rem] w-fit">
        <button
          onClick={() => setReportType('DAILY')}
          className={`px-8 py-2.5 rounded-2xl font-black text-caption transition-all ${reportType === 'DAILY' ? 'bg-emerald-800 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
        >
          LAPORAN HARIAN
        </button>
        <button
          onClick={() => setReportType('MONTHLY')}
          className={`px-8 py-2.5 rounded-2xl font-black text-caption transition-all ${reportType === 'MONTHLY' ? 'bg-emerald-800 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
        >
          REKAP BULANAN
        </button>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari Nama/ID Siswa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-[1.5rem] focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
            />
          </div>
          
          {reportType === 'DAILY' ? (
            <div className="relative">
              <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="pl-12 pr-6 py-4 bg-white border border-gray-200 rounded-[1.5rem] focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm font-bold text-gray-600"
              />
            </div>
          ) : (
            <div className="relative">
              <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="pl-12 pr-6 py-4 bg-white border border-gray-200 rounded-[1.5rem] focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm font-bold text-gray-600"
              />
            </div>
          )}

          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="px-6 py-4 bg-white border border-gray-200 rounded-[1.5rem] focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm font-bold text-gray-600"
          >
            <option value="ALL">Semua Kelas</option>
            {allKelas.map(k => <option key={k} value={k}>{k}</option>)}
          </select>

          {reportType === 'DAILY' && (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-6 py-4 bg-white border border-gray-200 rounded-[1.5rem] focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm font-bold text-gray-600"
            >
              <option value="ALL">Semua Status</option>
              {Object.values(ATTENDANCE_STATUS).filter(s => s !== 'AUTO').map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportToPDF}
            disabled={(reportType === 'DAILY' ? filteredLogs.length === 0 : monthlySummary.length === 0) || isExporting}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-emerald-800 text-white rounded-[1.5rem] font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 active:scale-95 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
            Export PDF
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatSummaryCard icon={CheckCircle} label="Hadir" value={filteredLogs.filter(l => l.status === 'HADIR').length} color="bg-emerald-500" textColor="text-emerald-800" bgColor="bg-emerald-50" />
        <StatSummaryCard icon={Clock} label="Terlambat" value={filteredLogs.filter(l => l.status === 'TERLAMBAT').length} color="bg-amber-500" textColor="text-amber-800" bgColor="bg-amber-50" />
        <StatSummaryCard icon={FileText} label="Sakit" value={filteredLogs.filter(l => l.status === 'SAKIT').length} color="bg-blue-500" textColor="text-blue-800" bgColor="bg-blue-50" />
        <StatSummaryCard icon={Filter} label="Izin" value={filteredLogs.filter(l => l.status === 'IZIN').length} color="bg-purple-500" textColor="text-purple-800" bgColor="bg-purple-50" />
        <StatSummaryCard icon={XCircle} label="Alfa" value={filteredLogs.filter(l => l.status === 'ALFA').length} color="bg-red-500" textColor="text-red-800" bgColor="bg-red-50" />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {reportType === 'DAILY' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-caption font-black text-gray-400 uppercase tracking-widest">Siswa</th>
                  <th className="px-8 py-5 text-caption font-black text-gray-400 uppercase tracking-widest">ID & Kelas</th>
                  <th className="px-8 py-5 text-caption font-black text-gray-400 uppercase tracking-widest">Jam</th>
                  <th className="px-8 py-5 text-caption font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-caption font-black text-gray-400 uppercase tracking-widest">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400">Memuat data...</td></tr>
                ) : filteredLogs.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400">Tidak ada data absensi</td></tr>
                ) : filteredLogs.map((log, index) => (
                  <tr key={`${log.idsiswa}-${log.jam}-${index}`} className="hover:bg-emerald-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700 font-black text-xs">
                          {(log.nama || 'T').charAt(0)}
                        </div>
                        <span className="font-bold text-gray-900 text-body">{log.nama || 'Tidak Dikenal'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-caption font-black text-gray-700">{log.idsiswa || '-'}</span>
                        <span className="text-caption font-bold text-gray-400">{log.kelas || '-'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-body font-black text-emerald-700">{log.jam}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-caption font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                        log.status === 'HADIR' ? 'bg-emerald-100 text-emerald-700' : 
                        log.status === 'TERLAMBAT' ? 'bg-amber-100 text-amber-700' :
                        log.status === 'SAKIT' ? 'bg-blue-100 text-blue-700' :
                        log.status === 'IZIN' ? 'bg-purple-100 text-purple-700' :
                        'bg-red-100 text-red-700'
                      }`}>
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
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-caption font-black text-gray-400 uppercase tracking-widest">Siswa</th>
                  <th className="px-8 py-5 text-caption font-black text-gray-400 uppercase tracking-widest text-center">H</th>
                  <th className="px-8 py-5 text-caption font-black text-gray-400 uppercase tracking-widest text-center">T</th>
                  <th className="px-8 py-5 text-caption font-black text-gray-400 uppercase tracking-widest text-center">S</th>
                  <th className="px-8 py-5 text-caption font-black text-gray-400 uppercase tracking-widest text-center">I</th>
                  <th className="px-8 py-5 text-caption font-black text-gray-400 uppercase tracking-widest text-center">A</th>
                  <th className="px-8 py-5 text-caption font-black text-gray-400 uppercase tracking-widest text-center">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={7} className="px-8 py-20 text-center text-gray-400">Memuat data...</td></tr>
                ) : monthlySummary.length === 0 ? (
                  <tr><td colSpan={7} className="px-8 py-20 text-center text-gray-400">Tidak ada data siswa</td></tr>
                ) : monthlySummary.map((s, index) => (
                  <tr key={`${s.id}-${index}`} className="hover:bg-emerald-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-body">{s.nama}</span>
                        <span className="text-caption text-gray-400">{s.id} • {s.kelas}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center font-bold text-emerald-600">{s.hadir}</td>
                    <td className="px-8 py-5 text-center font-bold text-amber-600">{s.terlambat}</td>
                    <td className="px-8 py-5 text-center font-bold text-blue-600">{s.sakit}</td>
                    <td className="px-8 py-5 text-center font-bold text-purple-600">{s.izin}</td>
                    <td className="px-8 py-5 text-center font-bold text-red-600">{s.alfa}</td>
                    <td className="px-8 py-5 text-center font-black text-gray-900">{s.hadir + s.terlambat + s.sakit + s.izin + s.alfa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatSummaryCard({ icon: Icon, label, value, color, textColor, bgColor }: any) {
  return (
    <div className={`${bgColor} p-4 rounded-2xl border border-gray-100 flex items-center gap-3`}>
      <div className={`w-10 h-10 ${color} text-white rounded-xl flex items-center justify-center shadow-sm`}>
        <Icon size={18} />
      </div>
      <div>
        <p className={`text-[9px] font-black ${textColor} uppercase tracking-widest`}>{label}</p>
        <h4 className={`text-[16px] font-black ${textColor}`}>{value}</h4>
      </div>
    </div>
  );
}
