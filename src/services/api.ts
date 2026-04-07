/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { INITIAL_USERS, INITIAL_SISWA, INITIAL_ABSENSI } from '../lib/mockData';
import { UserRole } from '../lib/constants';

const GAS_URL = import.meta.env.VITE_GAS_URL;

class ApiService {
  private users: any[] = [];
  private siswa: any[] = [];
  private absensi: any[] = [];
  private isFetching = false;
  private lastFetchTime = 0;
  private FETCH_COOLDOWN = 2000; // 2 detik cooldown

  constructor() {
    // Jika tidak ada GAS_URL, gunakan data dummy
    if (!GAS_URL) {
      this.users = [...INITIAL_USERS];
      this.siswa = [...INITIAL_SISWA];
      this.absensi = [...INITIAL_ABSENSI];
    }
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
    
    if (!GAS_URL || !GAS_URL.startsWith('https://script.google.com')) {
      console.warn('GAS_URL tidak valid atau belum dikonfigurasi. Menggunakan data lokal.');
      this.loadFromLocalStorage();
      return;
    }

    // Jangan fetch terlalu sering (cooldown), kecuali dipaksa (force)
    const now = Date.now();
    if (!force && (now - this.lastFetchTime < this.FETCH_COOLDOWN)) return;

    this.isFetching = true;
    const controller = new AbortController();
    // Tingkatkan timeout ke 60 detik karena GAS bisa sangat lambat
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 60000);

    try {
      const ts = Date.now();
      console.log('Sinkronisasi data dengan Spreadsheet...');
      
      // Sequential fetch untuk menghindari limit eksekusi konkuren di GAS
      // Ini lebih lambat tapi lebih stabil untuk koneksi yang tidak menentu
      
      const siswaRes = await fetch(`${GAS_URL}?action=getSiswa&_t=${ts}`, { signal: controller.signal, redirect: 'follow' });
      if (siswaRes.ok) {
        const data = await siswaRes.json();
        if (Array.isArray(data)) {
          this.siswa = this.normalizeData(data);
          localStorage.setItem('MH_SISWA', JSON.stringify(this.siswa));
        }
      }

      // Beri jeda sedikit antar request agar GAS tidak overload
      await new Promise(resolve => setTimeout(resolve, 500));

      const absensiRes = await fetch(`${GAS_URL}?action=getAbsensi&_t=${ts}`, { signal: controller.signal, redirect: 'follow' });
      if (absensiRes.ok) {
        const data = await absensiRes.json();
        if (Array.isArray(data)) {
          this.absensi = this.normalizeData(data);
          localStorage.setItem('MH_ABSENSI', JSON.stringify(this.absensi));
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const usersRes = await fetch(`${GAS_URL}?action=getUsers&_t=${ts}`, { signal: controller.signal, redirect: 'follow' });
      if (usersRes.ok) {
        const data = await usersRes.json();
        if (Array.isArray(data)) {
          this.users = this.normalizeData(data);
          localStorage.setItem('MH_USERS', JSON.stringify(this.users));
        }
      }
      
      this.lastFetchTime = Date.now();
      console.log('Sinkronisasi berhasil.');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.error('Koneksi ke Spreadsheet terputus: Waktu habis (Timeout 60s).');
      } else {
        console.error('Kesalahan koneksi Spreadsheet:', err.message);
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

    // 1. Handle YYYY-MM-DD format (avoiding Date object timezone shifts)
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }

    // 2. Handle DD/MM/YYYY or DD-MM-YYYY
    const ddmmyyyy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (ddmmyyyy) {
      return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`;
    }

    // Fallback to standard parsing but be careful with timezone
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      // Use local components to match browser's "today"
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    return str;
  }

  private getEntityId(item: any): string {
    if (!item) return '';
    // Cek berbagai kemungkinan kunci ID (id, idsiswa, nim, dll)
    const id = item.id || item.idsiswa || '';
    return id.toString().trim().toUpperCase();
  }

  async getDashboardStats(user: any, force = false) {
    // Pastikan data terbaru diambil jika force=true
    if (GAS_URL && force) {
      await this.fetchFromGAS(true);
    }
    
    const now = new Date();
    // Gunakan format yang sama dengan spreadsheet (YYYY-MM-DD)
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const filteredSiswa = this.filterByRole(this.siswa, user);
    
    // Filter absensi hari ini
    const absensiToday = this.absensi.filter(a => {
      const normalizedDate = this.formatDate(a.tanggal);
      return normalizedDate === todayStr;
    });
    
    // Pencocokan ID yang sangat fleksibel antara absensi dan siswa
    const relevantAbsensi = absensiToday.filter(a => {
      const aId = this.getEntityId(a);
      return filteredSiswa.some(s => this.getEntityId(s) === aId);
    });
    
    const hadirToday = relevantAbsensi.filter(a => {
      const status = (a.status || '').toString().toUpperCase().trim();
      return status === 'HADIR';
    }).length;

    const terlambatToday = relevantAbsensi.filter(a => {
      const status = (a.status || '').toString().toUpperCase().trim();
      return status === 'TERLAMBAT';
    }).length;

    const sakitToday = relevantAbsensi.filter(a => {
      const status = (a.status || '').toString().toUpperCase().trim();
      return status === 'SAKIT';
    }).length;

    const izinToday = relevantAbsensi.filter(a => {
      const status = (a.status || '').toString().toUpperCase().trim();
      return status === 'IZIN';
    }).length;

    const alfaToday = relevantAbsensi.filter(a => {
      const status = (a.status || '').toString().toUpperCase().trim();
      return status === 'ALFA';
    }).length;

    const totalSiswa = filteredSiswa.length;

    return {
      totalSiswa,
      hadirToday,
      terlambatToday,
      sakitToday,
      izinToday,
      alfaToday,
      tidakHadirToday: Math.max(0, totalSiswa - relevantAbsensi.length)
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
