/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { INITIAL_USERS, INITIAL_SISWA, INITIAL_ABSENSI } from '../lib/mockData';
import { UserRole } from '../lib/constants';

const GAS_URL = import.meta.env.VITE_GAS_URL;

class ApiService {
  private users = [...INITIAL_USERS];
  private siswa = [...INITIAL_SISWA];
  private absensi = [...INITIAL_ABSENSI];

  constructor() {
    this.init();
  }

  private async init() {
    if (GAS_URL) {
      await this.fetchFromGAS();
    } else {
      // Load from localStorage if available
      const savedSiswa = localStorage.getItem('MH_SISWA');
      if (savedSiswa) this.siswa = JSON.parse(savedSiswa);

      const savedAbsensi = localStorage.getItem('MH_ABSENSI');
      if (savedAbsensi) this.absensi = JSON.parse(savedAbsensi);
    }
  }

  private async fetchFromGAS() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn('Koneksi ke Google Apps Script timeout (15 detik).');
    }, 15000); // Tingkatkan ke 15 detik karena GAS sering lambat di awal

    try {
      console.log('Menghubungkan ke Spreadsheet...', GAS_URL);
      
      const siswaRes = await fetch(`${GAS_URL}?action=getSiswa`, { 
        signal: controller.signal,
        redirect: 'follow'
      });
      
      if (!siswaRes.ok) throw new Error(`HTTP error! status: ${siswaRes.status}`);
      
      const siswaData = await siswaRes.json();
      if (Array.isArray(siswaData)) {
        this.siswa = siswaData;
        console.log('Data Siswa berhasil dimuat dari Spreadsheet');
      }

      const absensiRes = await fetch(`${GAS_URL}?action=getAbsensi`, { 
        signal: controller.signal,
        redirect: 'follow'
      });
      
      if (!absensiRes.ok) throw new Error(`HTTP error! status: ${absensiRes.status}`);
      
      const absensiData = await absensiRes.json();
      if (Array.isArray(absensiData)) {
        this.absensi = absensiData;
        console.log('Data Absensi berhasil dimuat dari Spreadsheet');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn('Permintaan dibatalkan karena koneksi terlalu lambat (Timeout).');
      } else {
        console.error('Gagal memuat data dari Spreadsheet:', err.message);
      }
      
      // Fallback: Gunakan data lokal jika gagal
      this.loadFromLocalStorage();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private loadFromLocalStorage() {
    const savedSiswa = localStorage.getItem('MH_SISWA');
    if (savedSiswa) this.siswa = JSON.parse(savedSiswa);
    const savedAbsensi = localStorage.getItem('MH_ABSENSI');
    if (savedAbsensi) this.absensi = JSON.parse(savedAbsensi);
  }

  private async postToGAS(action: string, data: any) {
    if (!GAS_URL) return { success: false, message: 'GAS URL not configured' };
    try {
      // Gunakan text/plain untuk menghindari CORS preflight (OPTIONS request)
      // Google Apps Script tidak mendukung OPTIONS request
      const res = await fetch(GAS_URL, {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify({ action, data }),
        headers: { 
          'Content-Type': 'text/plain;charset=utf-8' 
        }
      });
      
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const result = await res.json();
      return result;
    } catch (err: any) {
      console.error(`Failed to post to GAS (${action}):`, err.message);
      return { success: false, message: 'Gagal mengirim data ke Google Sheets. Pastikan Deployment GAS sudah benar (Access: Anyone).' };
    }
  }

  private save() {
    if (!GAS_URL) {
      localStorage.setItem('MH_SISWA', JSON.stringify(this.siswa));
      localStorage.setItem('MH_ABSENSI', JSON.stringify(this.absensi));
    }
  }

  async login(email, password) {
    const user = this.users.find(u => u.email === email && u.password === password);
    if (user) {
      return { success: true, user: { email: user.email, role: user.role, nama: user.nama } };
    }
    return { success: false, message: 'Email atau Password salah' };
  }

  async getSiswa() {
    if (GAS_URL) await this.fetchFromGAS();
    return [...this.siswa];
  }

  async addSiswa(data) {
    const newSiswa = {
      ...data,
      id: `MH-${String(this.siswa.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString()
    };

    if (GAS_URL) {
      const res = await this.postToGAS('addSiswa', newSiswa);
      if (!res.success) return res;
    }

    this.siswa.push(newSiswa);
    this.save();
    return { success: true, data: newSiswa };
  }

  async updateSiswa(id, data) {
    const updateData = { ...data, id };
    if (GAS_URL) {
      const res = await this.postToGAS('updateSiswa', updateData);
      if (!res.success) return res;
    }

    const index = this.siswa.findIndex(s => s.id === id);
    if (index !== -1) {
      this.siswa[index] = { ...this.siswa[index], ...data };
      this.save();
      return { success: true };
    }
    return { success: false, message: 'Siswa tidak ditemukan' };
  }

  async deleteSiswa(id) {
    if (GAS_URL) {
      const res = await this.postToGAS('deleteSiswa', { id });
      if (!res.success) return res;
    }

    this.siswa = this.siswa.filter(s => s.id !== id);
    this.save();
    return { success: true };
  }

  async submitAbsensi(idSiswa, status, keterangan = '') {
    const siswa = this.siswa.find(s => s.id === idSiswa);
    if (!siswa) return { success: false, message: 'Siswa tidak ditemukan' };

    const today = new Date().toISOString().split('T')[0];
    const alreadyAbsen = this.absensi.find(a => a.idSiswa === idSiswa && a.tanggal === today);
    if (alreadyAbsen) return { success: false, message: 'Sudah absen hari ini' };

    const now = new Date();
    const jam = now.toLocaleTimeString('id-ID');
    const newAbsensi = { idSiswa, tanggal: today, jam, status, keterangan };
    
    if (GAS_URL) {
      const res = await this.postToGAS('submitAbsensi', newAbsensi);
      if (!res.success) return res;
    }

    this.absensi.push(newAbsensi);
    this.save();
    
    return { 
      success: true, 
      message: `Absensi ${siswa.nama} berhasil`, 
      data: { 
        nama: siswa.nama, 
        jam,
        wa: siswa.wa,
        status
      } 
    };
  }

  async getDashboardStats() {
    if (GAS_URL) await this.fetchFromGAS();
    const today = new Date().toISOString().split('T')[0];
    const absensiToday = this.absensi.filter(a => a.tanggal === today);
    
    const hadirToday = absensiToday.filter(a => a.status === 'HADIR').length;
    const terlambatToday = absensiToday.filter(a => a.status === 'TERLAMBAT').length;
    const totalSiswa = this.siswa.length;

    return {
      totalSiswa,
      hadirToday,
      terlambatToday,
      tidakHadirToday: totalSiswa - (hadirToday + terlambatToday)
    };
  }

  async getAbsensiLogs() {
    if (GAS_URL) await this.fetchFromGAS();
    return this.absensi.map(log => {
      const s = this.siswa.find(siswa => siswa.id === log.idSiswa);
      return {
        ...log,
        nama: s ? s.nama : 'Tidak Dikenal',
        kelas: s ? s.kelas : 'N/A',
        jenjang: s ? s.jenjang : 'N/A',
        wa: s ? s.wa : ''
      };
    }).reverse();
  }
}

export const api = new ApiService();
