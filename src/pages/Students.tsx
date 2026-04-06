/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  MoreVertical, 
  UserPlus,
  Download,
  Check,
  X,
  CreditCard,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { JENJANG, KELAS, UserRole } from '../lib/constants';
import Toast, { ToastType } from '../components/Toast';

export default function Students({ user }: { user: any }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('ALL');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<any>(null);
  const [toast, setToast] = useState<{ isVisible: boolean; message: string; type: ToastType }>({
    isVisible: false,
    message: '',
    type: 'success'
  });

  const [formData, setFormData] = useState({
    nama: '',
    jenjang: 'SD',
    kelas: '1-A',
    nisn: '',
    wa: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    alamat: '',
    foto: ''
  });

  useEffect(() => {
    fetchStudents();
  }, [user]);

  const fetchStudents = async () => {
    setLoading(true);
    const data = await api.getSiswa(user);
    setStudents(data);
    setLoading(false);
  };

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let result;
    if (editingSiswa) {
      result = await api.updateSiswa(editingSiswa.id, formData);
      if (result.success) showToast('Data siswa berhasil diperbarui');
    } else {
      result = await api.addSiswa(formData);
      if (result.success) showToast('Data siswa berhasil ditambahkan ke sistem');
    }
    
    if (result.success) {
      setModalOpen(false);
      setEditingSiswa(null);
      setFormData({ nama: '', jenjang: 'SD', kelas: '1-A', nisn: '', wa: '', tempat_lahir: '', tanggal_lahir: '', alamat: '', foto: '' });
      fetchStudents();
    } else {
      showToast(result.message || 'Gagal menyimpan data', 'error');
    }
  };

  const handleEdit = (siswa: any) => {
    setEditingSiswa(siswa);
    setFormData({
      nama: siswa.nama,
      jenjang: siswa.jenjang,
      kelas: siswa.kelas,
      nisn: siswa.nisn || '',
      wa: siswa.wa || '',
      tempat_lahir: siswa.tempat_lahir || '',
      tanggal_lahir: siswa.tanggal_lahir || '',
      alamat: siswa.alamat || '',
      foto: siswa.foto || ''
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus data siswa ini?')) {
      const result = await api.deleteSiswa(id);
      if (result.success) {
        showToast('Data siswa berhasil dihapus');
        fetchStudents();
      } else {
        showToast(result.message || 'Gagal menghapus data', 'error');
      }
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJenjang = filterJenjang === 'ALL' || s.jenjang === filterJenjang;
    return matchesSearch && matchesJenjang;
  });

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari Nama atau ID Siswa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={filterJenjang}
              onChange={(e) => setFilterJenjang(e.target.value)}
              className="pl-12 pr-8 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none shadow-sm font-bold text-gray-600"
            >
              <option value="ALL">Semua Jenjang</option>
              {JENJANG.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
        </div>

        {user.role === UserRole.ADMIN && (
          <button
            onClick={() => { setEditingSiswa(null); setModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-800 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
          >
            <UserPlus size={20} />
            Tambah Siswa
          </button>
        )}
      </div>

      {/* List Section */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-gray-400 bg-white rounded-[2rem] border border-gray-100">
            <div className="w-10 h-10 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Memuat data...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-20 text-center text-gray-400 bg-white rounded-[2rem] border border-gray-100">
            Tidak ada data siswa
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredStudents.map((siswa, index) => (
              <motion.div
                key={`${siswa.id}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between group active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 font-black text-xl border-2 border-white shadow-sm">
                    {siswa.nama.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-[16px] text-gray-900 leading-tight">{siswa.nama}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-caption font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {siswa.kelas}
                      </span>
                      <span className="text-caption font-bold text-gray-400">
                        ID: {siswa.id}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEdit(siswa)}
                    className="p-3 bg-gray-50 text-gray-600 rounded-2xl active:bg-emerald-100 active:text-emerald-700 transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  {user.role === UserRole.ADMIN && (
                    <button 
                      onClick={() => handleDelete(siswa.id)}
                      className="p-3 bg-gray-50 text-red-600 rounded-2xl active:bg-red-100 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-emerald-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-8 bg-emerald-800 text-white flex items-center justify-between sticky top-0 z-10">
                <div>
                  <h3 className="text-[20px] font-black">{editingSiswa ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</h3>
                  <p className="text-emerald-200 text-caption">Lengkapi informasi siswa di bawah ini</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 custom-scrollbar">
                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-caption font-black text-gray-700 ml-1">Nama Lengkap Siswa</label>
                      <input
                        type="text"
                        required
                        value={formData.nama}
                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-body"
                        placeholder="Contoh: Ahmad Zaki"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-caption font-black text-gray-700 ml-1">Jenjang</label>
                      <select
                        value={formData.jenjang}
                        onChange={(e) => setFormData({ ...formData, jenjang: e.target.value })}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-body"
                      >
                        {JENJANG.map(j => <option key={j} value={j}>{j}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-caption font-black text-gray-700 ml-1">Kelas</label>
                      <select
                        value={formData.kelas}
                        onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-body"
                      >
                        {KELAS[formData.jenjang].map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-caption font-black text-gray-700 ml-1">NISN</label>
                      <input
                        type="text"
                        value={formData.nisn}
                        onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-body"
                        placeholder="Masukkan NISN"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-caption font-black text-gray-700 ml-1">No. WhatsApp Wali (62...)</label>
                      <input
                        type="text"
                        required
                        value={formData.wa}
                        onChange={(e) => setFormData({ ...formData, wa: e.target.value })}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-body"
                        placeholder="628123456789"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-caption font-black text-gray-700 ml-1">Tempat Lahir</label>
                      <input
                        type="text"
                        value={formData.tempat_lahir}
                        onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-body"
                        placeholder="Contoh: Jakarta"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-caption font-black text-gray-700 ml-1">Tanggal Lahir</label>
                      <input
                        type="date"
                        value={formData.tanggal_lahir}
                        onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-body"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-caption font-black text-gray-700 ml-1">Alamat Lengkap</label>
                      <textarea
                        value={formData.alamat}
                        onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none min-h-[100px] text-body"
                        placeholder="Masukkan alamat lengkap siswa..."
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-caption font-black text-gray-700 ml-1">URL Foto (Opsional)</label>
                      <input
                        type="url"
                        value={formData.foto}
                        onChange={(e) => setFormData({ ...formData, foto: e.target.value })}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-body"
                        placeholder="https://example.com/foto.jpg"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 pt-4 sticky bottom-0 bg-white pb-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all order-2 md:order-1"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-4 bg-emerald-800 text-white rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 order-1 md:order-2"
                    >
                      <Check size={20} />
                      {editingSiswa ? 'Simpan Perubahan' : 'Simpan Data'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Toast 
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
}
