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
  private isFetching = false;
  private lastFetchTime = 0;
  private FETCH_COOLDOWN = 5000; // 5 detik cooldown antar fetch

  constructor() {
    this.init();
  }

  private async init() {
    if (GAS_URL) {
      await this.fetchFromGAS();
    } else {
      this.loadFromLocalStorage();
    }
  }

  private async fetchFromGAS(force = false) {
    if (this.isFetching) return;
    
    // Jangan fetch terlalu sering (cooldown), kecuali dipaksa (force)
    const now = Date.now();
    if (!force && (now - this.lastFetchTime < this.FETCH_COOLDOWN)) return;

    this.isFetching = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn('Koneksi ke Google Apps Script timeout (30 detik).');
    }, 30000);

    try {
      // Tambahkan timestamp untuk menghindari cache browser
      const ts = Date.now();
      console.log('Menghubungkan ke Spreadsheet (Sync)...');
      
      const fetchSiswa = fetch(`${GAS_URL}?action=getSiswa&_t=${ts}`, { signal: controller.signal, redirect: 'follow' });
      const fetchAbsensi = fetch(`${GAS_URL}?action=getAbsensi&_t=${ts}`, { signal: controller.signal, redirect: 'follow' });
      const fetchUsers = fetch(`${GAS_URL}?action=getUsers&_t=${ts}`, { signal: controller.signal, redirect: 'follow' });

      const [siswaRes, absensiRes, usersRes] = await Promise.all([fetchSiswa, fetchAbsensi, fetchUsers]);

      if (siswaRes.ok) {
        const siswaData = await siswaRes.json();
        if (Array.isArray(siswaData)) {
          this.siswa = this.normalizeData(siswaData);
          localStorage.setItem('MH_SISWA', JSON.stringify(this.siswa));
        }
      }

      if (absensiRes.ok) {
        const absensiData = await absensiRes.json();
        if (Array.isArray(absensiData)) {
          this.absensi = this.normalizeData(absensiData);
          localStorage.setItem('MH_ABSENSI', JSON.stringify(this.absensi));
        }
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (Array.isArray(usersData)) {
          this.users = this.normalizeData(usersData);
          localStorage.setItem('MH_USERS', JSON.stringify(this.users));
        }
      }
      
      this.lastFetchTime = Date.now();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.error('Gagal memuat data: Waktu koneksi habis (Timeout).');
      } else {
        console.error('Gagal memuat data dari Spreadsheet:', err.message);
      }
      this.loadFromLocalStorage();
    } finally {
      clearTimeout(timeoutId);
      this.isFetching = false;
    }
  }

  private normalizeData(data: any[]) {
    if (!Array.isArray(data)) return [];
    return data.map(item => {
      const normalized: any = {};
      for (const key in item) {
        // Hapus spasi dari kunci (misal "ID Siswa" -> "idsiswa")
        const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
        let value = item[key];
        // Trim string values to avoid comparison issues
        if (typeof value === 'string') value = value.trim();
        normalized[normalizedKey] = value;
      }
      return normalized;
    });
  }

  private loadFromLocalStorage() {
    const savedSiswa = localStorage.getItem('MH_SISWA');
    if (savedSiswa) this.siswa = JSON.parse(savedSiswa);
    const savedAbsensi = localStorage.getItem('MH_ABSENSI');
    if (savedAbsensi) this.absensi = JSON.parse(savedAbsensi);
    const savedUsers = localStorage.getItem('MH_USERS');
    if (savedUsers) this.users = JSON.parse(savedUsers);
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
      localStorage.setItem('MH_USERS', JSON.stringify(this.users));
    }
  }

  async login(email, password) {
    if (GAS_URL) await this.fetchFromGAS(true);
    const user = this.users.find(u => u.email === email && u.password === password);
    if (user) {
      return { success: true, user: { ...user } };
    }
    return { success: false, message: 'Email atau Password salah' };
  }

  private filterByRole(data: any[], user: any) {
    if (!user) return [];
    if (user.role === UserRole.ADMIN || user.role === UserRole.KEPALA_SEKOLAH || user.kelas_diampu === 'ALL') {
      return data;
    }
    return data.filter(item => {
      const itemKelas = (item.kelas || item.kelas_diampu || '').toString().trim().toUpperCase();
      const userKelas = (user.kelas_diampu || '').toString().trim().toUpperCase();
      return itemKelas === userKelas;
    });
  }

  async getSiswa(user: any) {
    if (GAS_URL) await this.fetchFromGAS();
    return this.filterByRole(this.siswa, user);
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
    const alreadyAbsen = this.absensi.find(a => (a.idsiswa) === idSiswa && a.tanggal === today);
    if (alreadyAbsen) return { success: false, message: 'Sudah absen hari ini' };

    const now = new Date();
    const jam = now.toLocaleTimeString('id-ID');
    const newAbsensi = { idsiswa: idSiswa, tanggal: today, jam, status, keterangan };
    
    if (GAS_URL) {
      const res = await this.postToGAS('submitAbsensi', { idSiswa, tanggal: today, jam, status, keterangan });
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

  private formatDate(dateInput: any): string {
    if (!dateInput) return '';
    const str = dateInput.toString().trim();
    if (!str) return '';

    // 1. Handle ISO format (2026-04-07T...)
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.split('T')[0];
    }

    // 2. Handle DD/MM/YYYY or DD-MM-YYYY
    const ddmmyyyy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (ddmmyyyy) {
      return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`;
    }

    // 3. Handle MM/DD/YYYY (common in some locales)
    const mmddyyyy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    // Note: This is ambiguous with DD/MM/YYYY. Usually, if first part > 12, it's DD.
    // But let's try standard JS Date parsing as fallback
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    return str;
  }

  async getDashboardStats(user: any, force = false) {
    if (GAS_URL) await this.fetchFromGAS(force);
    
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const filteredSiswa = this.filterByRole(this.siswa, user);
    
    // Filter absensi hari ini dengan normalisasi tanggal yang sangat kuat
    const absensiToday = this.absensi.filter(a => {
      const normalizedDate = this.formatDate(a.tanggal);
      return normalizedDate === todayStr;
    });
    
    // Gunakan ID yang sudah di-trim dan uppercase untuk perbandingan
    const relevantAbsensi = absensiToday.filter(a => {
      const aId = (a.idsiswa || '').toString().trim().toUpperCase();
      return filteredSiswa.some(s => s.id.toString().trim().toUpperCase() === aId);
    });
    
    const hadirToday = relevantAbsensi.filter(a => (a.status || '').toString().toUpperCase().trim() === 'HADIR').length;
    const terlambatToday = relevantAbsensi.filter(a => (a.status || '').toString().toUpperCase().trim() === 'TERLAMBAT').length;
    const totalSiswa = filteredSiswa.length;

    console.log(`Stats Sync Debug: Today=${todayStr}, Found Absensi Today=${absensiToday.length}, Relevant=${relevantAbsensi.length}`);

    return {
      totalSiswa,
      hadirToday,
      terlambatToday,
      tidakHadirToday: Math.max(0, totalSiswa - (hadirToday + terlambatToday))
    };
  }

  async getAbsensiLogs(user: any, force = false) {
    if (GAS_URL) await this.fetchFromGAS(force);
    const filteredSiswa = this.filterByRole(this.siswa, user);
    
    return this.absensi
      .filter(log => {
        const id = (log.idsiswa || '').toString().trim().toUpperCase();
        return filteredSiswa.some(s => s.id.toString().trim().toUpperCase() === id);
      })
      .map(log => {
        const id = (log.idsiswa || '').toString().trim().toUpperCase();
        const s = this.siswa.find(siswa => siswa.id.toString().trim().toUpperCase() === id);
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
