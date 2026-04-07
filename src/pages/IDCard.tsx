/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  FileDown,
  UserCircle,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Users,
  School,
  Calendar,
  MapPin,
  Printer
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { JENJANG } from '../lib/constants';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

// Ukuran kartu ID portrait (standar ID-1 diputar 90°)
// Lebar 54mm x Tinggi 85.6mm
const CARD_WIDTH_MM = 53.98;   // lebar portrait (standar ID-1 height)
const CARD_HEIGHT_MM = 85.6;   // tinggi portrait (standar ID-1 width)
const CARD_WIDTH_PX = 204;     // ~96 DPI
const CARD_HEIGHT_PX = 323;    // ~96 DPI

// LOGO SEKOLAH (dari Cloudinary)
const SCHOOL_LOGO = 'https://res.cloudinary.com/maswardi/image/upload/q_auto/f_auto/v1770822838/mifhida_hretkz.png';

export default function IDCard({ user }: { user: any }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('ALL');
  const [filterKelas, setFilterKelas] = useState('ALL');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const data = await api.getSiswa(user);
    setStudents(data);
    const classes = [...new Set(data.map((s: any) => s.kelas).filter(Boolean))];
    setAvailableClasses(classes);
    setLoading(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const handlePrint = () => {
    if (selectedStudents.length === 0) return;
    window.print();
  };

  const exportToPDF = async () => {
    if (selectedStudents.length === 0) return;
    setIsExporting(true);

    try {
      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      });
      
      const cardsPerRow = 2;
      const cardsPerCol = 3;
      const cardsPerPage = cardsPerRow * cardsPerCol;
      
      const marginX = 20;
      const marginY = 15;
      const cardSpacing = 5;
      
      for (let i = 0; i < selectedStudents.length; i++) {
        const id = selectedStudents[i];
        const element = cardRefs.current[id];
        
        if (element) {
          // html-to-image handles modern CSS (oklch) much better than html2canvas
          const dataUrl = await toPng(element, { 
            quality: 0.95,
            pixelRatio: 3,
            backgroundColor: '#ffffff'
          });
          
          const row = Math.floor((i % cardsPerPage) / cardsPerRow);
          const col = (i % cardsPerPage) % cardsPerRow;
          
          const x = marginX + (col * (CARD_WIDTH_MM + cardSpacing));
          const y = marginY + (row * (CARD_HEIGHT_MM + cardSpacing));
          
          pdf.addImage(dataUrl, 'PNG', x, y, CARD_WIDTH_MM, CARD_HEIGHT_MM);
          
          if ((i + 1) % cardsPerPage === 0 && i < selectedStudents.length - 1) {
            pdf.addPage();
          }
        }
      }
      
      pdf.save(`ID_Card_Siswa_${new Date().getTime()}.pdf`);
      setNotification({ message: 'Berhasil mencetak PDF!', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('PDF Export Error:', err);
      setNotification({ message: 'Gagal mencetak PDF. Silakan coba lagi.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.nisn?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJenjang = filterJenjang === 'ALL' || s.jenjang === filterJenjang;
    const matchesKelas = filterKelas === 'ALL' || s.kelas === filterKelas;
    return matchesSearch && matchesJenjang && matchesKelas;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4"
          >
            <div className={`flex items-center gap-3 p-4 rounded-2xl shadow-xl border ${
              notification.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : 'bg-red-50 border-red-100 text-red-800'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle2 className="text-emerald-600" size={20} />
              ) : (
                <AlertCircle className="text-red-600" size={20} />
              )}
              <p className="font-bold">{notification.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-8 no-print">
        {/* Header dan Filter (sama seperti sebelumnya, tidak berubah) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-[20px] font-bold text-gray-900">Kartu Identitas Siswa</h1>
              <p className="text-body text-gray-500 mt-1">Cetak kartu ID untuk siswa/i Miftahul Hidayah</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={selectAll}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
              >
                {selectedStudents.length === filteredStudents.length ? 'Batal Semua' : 'Pilih Semua'}
              </button>
              <button
                onClick={exportToPDF}
                disabled={selectedStudents.length === 0 || isExporting}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Printer size={20} />
                )}
                <span>{isExporting ? 'Memproses...' : `Cetak (${selectedStudents.length})`}</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Cari nama, NIS, atau NISN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
            
            <select
              value={filterJenjang}
              onChange={(e) => {
                setFilterJenjang(e.target.value);
                setFilterKelas('ALL');
              }}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="ALL">Semua Jenjang</option>
              {JENJANG.map(j => <option key={j} value={j}>{j}</option>)}
            </select>

            {filterJenjang !== 'ALL' && (
              <select
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="ALL">Semua Kelas</option>
                {availableClasses.filter(c => c?.startsWith(filterJenjang)).map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-emerald-600" />
                <span className="text-body text-gray-600">Total Siswa:</span>
                <span className="font-bold text-gray-900">{filteredStudents.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-600" />
                <span className="text-body text-gray-600">Dipilih:</span>
                <span className="font-bold text-emerald-600">{selectedStudents.length}</span>
              </div>
            </div>
            <div className="text-caption text-gray-500">
              * Klik pada kartu untuk memilih/membatalkan
            </div>
          </div>
        </div>

        {/* Cards Grid - Portrait */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-gray-400">Memuat data...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-400">Tidak ada data siswa yang sesuai</div>
          ) : (
            filteredStudents.map((siswa) => (
              <motion.div 
                key={siswa.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative transition-all ${selectedStudents.includes(siswa.id) ? 'scale-[1.02]' : ''}`}
                onClick={() => toggleSelect(siswa.id)}
              >
                {/* Selection Badge */}
                <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all shadow-lg cursor-pointer ${
                  selectedStudents.includes(siswa.id) 
                    ? 'bg-emerald-500 text-white scale-100' 
                    : 'bg-white text-gray-400 scale-90 border-2 border-gray-200'
                }`}>
                  <CheckCircle2 size={18} />
                </div>

                {/* ID CARD - PORTRAIT VERSION */}
                <div 
                  ref={el => cardRefs.current[siswa.id] = el}
                  className="relative rounded-xl overflow-hidden cursor-pointer transition-shadow"
                  style={{ 
                    width: `${CARD_WIDTH_PX}px`, 
                    height: `${CARD_HEIGHT_PX}px`,
                    backgroundColor: '#ffffff',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' // shadow-lg equivalent
                  }}
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0" style={{ opacity: 0.05 }}>
                    <div 
                      className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16"
                      style={{ backgroundColor: '#10b981' }} // emerald-500
                    ></div>
                    <div 
                      className="absolute bottom-0 left-0 w-24 h-24 rounded-full -ml-12 -mb-12"
                      style={{ backgroundColor: '#10b981' }} // emerald-500
                    ></div>
                  </div>

                  {/* Content - Vertical Layout */}
                  <div className="relative h-full flex flex-col">
                    {/* Header with School Logo */}
                    <div 
                      className="px-3 py-3 flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#065f46' }} // emerald-800 equivalent
                    >
                      <div 
                        className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1.5"
                        style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }} // shadow-md
                      >
                        <img 
                          src={SCHOOL_LOGO}
                          alt="Logo YPI Miftahul Hidayah" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="text-white">
                        <h3 className="text-[10px] font-bold leading-tight tracking-wide">YPI MIFTAHUL HIDAYAH</h3>
                        <p className="text-[8px] leading-tight font-medium" style={{ color: '#d1fae5' }}>KARTU PRESENSI DIGITAL</p>
                      </div>
                    </div>

                    {/* Student Info - Top */}
                    <div className="text-center mt-4 px-3">
                      <div 
                        className="inline-block px-3 py-0.5 rounded-full text-[9px] font-bold mb-2"
                        style={{ backgroundColor: '#d1fae5', color: '#065f46' }}
                      >
                        {siswa.jenjang}
                      </div>
                      <h4 className="text-[13px] font-bold leading-tight uppercase mb-1" style={{ color: '#111827' }}>{siswa.nama}</h4>
                      <div className="flex justify-center items-center gap-2">
                        <span className="text-[8px] uppercase font-bold" style={{ color: '#9ca3af' }}>NIS:</span>
                        <span className="text-[11px] font-black tracking-wider" style={{ color: '#059669' }}>{siswa.id}</span>
                      </div>
                      <div className="flex justify-center items-center gap-2 mt-0.5">
                        <span className="text-[8px] uppercase font-bold" style={{ color: '#9ca3af' }}>Kelas:</span>
                        <span className="text-[10px] font-bold" style={{ color: '#374151' }}>{siswa.kelas || '-'}</span>
                      </div>
                    </div>

                    {/* LARGE QR Code Section - THE MAIN FOCUS */}
                    <div className="flex-1 flex flex-col items-center justify-center px-4 py-2">
                      <div 
                        className="bg-white p-4 rounded-2xl border-2 transform hover:scale-105 transition-transform"
                        style={{ 
                          borderColor: '#d1fae5',
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' // shadow-xl equivalent
                        }}
                      >
                        <QRCodeSVG 
                          value={siswa.id} 
                          size={110} 
                          level="H" 
                          bgColor="#ffffff"
                          fgColor="#059669"
                          includeMargin={false}
                        />
                      </div>
                      <p className="mt-3 text-[8px] font-black uppercase tracking-[0.4em] opacity-50" style={{ color: '#064e3b' }}>Scan to Attend</p>
                    </div>

                    {/* Student Details - Bottom (Compact) */}
                    <div className="px-4 pb-3 space-y-1">
                      <div 
                        className="flex justify-between pb-0.5"
                        style={{ borderBottom: '1px solid #f9fafb' }} // border-gray-50
                      >
                        <span className="text-[7px] uppercase font-bold" style={{ color: '#9ca3af' }}>TTL</span>
                        <span className="text-[8px] font-bold truncate max-w-[100px]" style={{ color: '#374151' }}>
                          {siswa.tempat_lahir ? `${siswa.tempat_lahir}, ${siswa.tanggal_lahir}` : '-'}
                        </span>
                      </div>
                      {siswa.nisn && (
                        <div 
                          className="flex justify-between pb-0.5"
                          style={{ borderBottom: '1px solid #f9fafb' }} // border-gray-50
                        >
                          <span className="text-[7px] uppercase font-bold" style={{ color: '#9ca3af' }}>NISN</span>
                          <span className="text-[8px] font-bold" style={{ color: '#374151' }}>{siswa.nisn}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="py-1.5 px-3" style={{ backgroundColor: '#059669' }}>
                      <p className="text-[7px] text-center text-white font-bold uppercase tracking-widest">
                        Miftahul Hidayah Islamic School
                      </p>
                    </div>
                  </div>

                  {/* Border Accent */}
                  <div 
                    className="absolute top-0 left-0 bottom-0 w-1"
                    style={{ background: 'linear-gradient(to bottom, #10b981, #065f46, #10b981)' }}
                  ></div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 no-print">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 rounded-xl shrink-0">
              <AlertCircle size={20} className="text-blue-600" />
            </div>
            <div className="space-y-2">
              <h4 className="text-[16px] font-bold text-gray-900">Panduan Cetak Kartu ID (Portrait)</h4>
              <ul className="text-body text-gray-600 space-y-1 list-disc ml-4">
                <li>Klik pada kartu untuk memilih siswa yang akan dicetak</li>
                <li>Gunakan tombol <strong>"Pilih Semua"</strong> untuk memilih semua siswa yang tampil</li>
                <li>Klik <strong>"Cetak"</strong> untuk membuka dialog cetak browser</li>
                <li>Pada dialog cetak, pilih <strong>"Save as PDF"</strong> atau pilih printer Anda</li>
                <li>Pastikan <strong>"Background Graphics"</strong> dicentang agar warna kartu muncul</li>
              </ul>
            </div>
          </div>
        </div>

        {/* PRINT ONLY SECTION */}
        <div className="hidden print:block print-section">
          <div className="grid grid-cols-2 gap-4 p-4">
            {students.filter(s => selectedStudents.includes(s.id)).map((siswa) => (
              <div 
                key={`print-${siswa.id}`}
                className="relative rounded-xl overflow-hidden border border-gray-200"
                style={{ 
                  width: `${CARD_WIDTH_PX}px`, 
                  height: `${CARD_HEIGHT_PX}px`,
                  backgroundColor: '#ffffff',
                  pageBreakInside: 'avoid',
                  margin: '0 auto 20px auto'
                }}
              >
                {/* Content - Vertical Layout */}
                <div className="relative h-full flex flex-col">
                  {/* Header with School Logo */}
                  <div 
                    className="px-3 py-3 flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#065f46' }}
                  >
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1.5">
                      <img 
                        src={SCHOOL_LOGO}
                        alt="Logo" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="text-white">
                      <h3 className="text-[10px] font-bold leading-tight">YPI MIFTAHUL HIDAYAH</h3>
                      <p className="text-[8px] leading-tight font-medium" style={{ color: '#d1fae5' }}>KARTU PRESENSI DIGITAL</p>
                    </div>
                  </div>

                  {/* Student Info */}
                  <div className="text-center mt-4 px-3">
                    <div 
                      className="inline-block px-3 py-0.5 rounded-full text-[9px] font-bold mb-2"
                      style={{ backgroundColor: '#d1fae5', color: '#065f46' }}
                    >
                      {siswa.jenjang}
                    </div>
                    <h4 className="text-[13px] font-bold leading-tight uppercase mb-1" style={{ color: '#111827' }}>{siswa.nama}</h4>
                    <div className="flex justify-center items-center gap-2">
                      <span className="text-[8px] uppercase font-bold" style={{ color: '#9ca3af' }}>NIS:</span>
                      <span className="text-[11px] font-black tracking-wider" style={{ color: '#059669' }}>{siswa.id}</span>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex-1 flex flex-col items-center justify-center px-4 py-2">
                    <div 
                      className="bg-white p-4 rounded-2xl border-2"
                      style={{ borderColor: '#d1fae5' }}
                    >
                      <QRCodeSVG 
                        value={siswa.id} 
                        size={110} 
                        level="H" 
                        bgColor="#ffffff"
                        fgColor="#059669"
                        includeMargin={false}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="py-1.5 px-3" style={{ backgroundColor: '#059669' }}>
                    <p className="text-[7px] text-center text-white font-bold uppercase tracking-widest">
                      Miftahul Hidayah Islamic School
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}