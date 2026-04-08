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
  private fetchPromise: Promise<void> | null = null;
  private lastFetchTime = 0;
  private FETCH_COOLDOWN = 2000; // 2 detik cooldown

  constructor() {
    // Inisialisasi awal dengan data dummy agar aplikasi bisa langsung digunakan
    this.users = [...INITIAL_USERS];
    this.siswa = [...INITIAL_SISWA];
    this.absensi = [...INITIAL_ABSENSI];
    
    this.init();
  }

  private async init() {
    this.loadFromLocalStorage();
    if (GAS_URL) {
      await this.fetchFromGAS();
    }
  }

  private async fetchFromGAS(force = false) {
    // Jika sedang fetching, tunggu hingga selesai
    if (this.isFetching && this.fetchPromise) {
      return this.fetchPromise;
    }
    
    if (!GAS_URL || !GAS_URL.startsWith('https://script.google.com')) {
      return;
    }

    const now = Date.now();
    if (!force && (now - this.lastFetchTime < this.FETCH_COOLDOWN)) return;

    this.isFetching = true;
    this.fetchPromise = (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      try {
        const ts = Date.now();
        console.log('Sinkronisasi data dengan Spreadsheet...');
        
        // Sequential fetch
        const siswaRes = await fetch(`${GAS_URL}?action=getSiswa&_t=${ts}`, { signal: controller.signal, redirect: 'follow' });
        if (siswaRes.ok) {
          const data = await siswaRes.json();
          if (Array.isArray(data) && data.length > 0) {
            this.siswa = this.normalizeData(data);
            localStorage.setItem('MH_SISWA', JSON.stringify(this.siswa));
          }
        }

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
          if (Array.isArray(data) && data.length > 0) {
            this.users = this.normalizeData(data);
            localStorage.setItem('MH_USERS', JSON.stringify(this.users));
          }
        }
        
        this.lastFetchTime = Date.now();
        console.log('Sinkronisasi berhasil.');
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.error('Koneksi ke Spreadsheet terputus: Waktu habis (Timeout 120s).');
        } else {
          console.error('Kesalahan koneksi Spreadsheet:', err.message);
        }
        // Jika gagal, data tetap menggunakan yang ada di memori/local storage
      } finally {
        clearTimeout(timeoutId);
        this.isFetching = false;
        this.fetchPromise = null;
      }
    })();

    return this.fetchPromise;
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
    // Saat login, coba sinkronisasi tapi beri batas waktu agar tidak hang
    if (GAS_URL) {
      try {
        // Beri waktu maksimal 10 detik untuk sinkronisasi saat login
        // Jika lebih dari itu, gunakan data yang sudah ada (local/memory)
        await Promise.race([
          this.fetchFromGAS(true),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Sync timeout')), 10000))
        ]);
      } catch (e) {
        console.warn('Login proceeding with local data due to sync delay/error');
      }
    }

    const user = this.users.find(u => 
      u.email.toString().trim().toLowerCase() === email.toString().trim().toLowerCase() && 
      u.password.toString().trim() === password.toString().trim()
    );

    if (user) {
      return { success: true, user: { ...user } };
    }

    // Jika gagal dan data users masih kosong, coba load dari local storage sekali lagi
    if (this.users.length === 0) {
      this.loadFromLocalStorage();
      const retryUser = this.users.find(u => 
        u.email.toString().trim().toLowerCase() === email.toString().trim().toLowerCase() && 
        u.password.toString().trim() === password.toString().trim()
      );
      if (retryUser) return { success: true, user: { ...retryUser } };
    }

    return { success: false, message: 'Email atau Password salah. Pastikan data di Spreadsheet sudah benar.' };
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
    const sId = this.normalizeId(idSiswa);
    const siswa = this.siswa.find(s => this.normalizeId(s.id) === sId);
    if (!siswa) return { success: false, message: 'Siswa tidak ditemukan' };

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    // Pengecekan teliti untuk mencegah 1 siswa 2 kali presensi dalam hari yang sama
    const alreadyAbsen = this.absensi.find(a => 
      this.normalizeId(a.idsiswa) === sId && 
      this.formatDate(a.tanggal) === today
    );
    
    if (alreadyAbsen) {
      return { 
        success: false, 
        message: `Siswa ${siswa.nama} sudah melakukan presensi hari ini pada pukul ${alreadyAbsen.jam}` 
      };
    }

    const jam = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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

  public formatDate(dateInput: any): string {
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

  public normalizeId(id: any): string {
    if (!id) return '';
    return id.toString().trim().toUpperCase();
  }

  private getEntityId(item: any): string {
    if (!item) return '';
    // Cek berbagai kemungkinan kunci ID (id, idsiswa, nim, dll)
    const id = item.id || item.idsiswa || '';
    return this.normalizeId(id);
  }

  async getDashboardStats(user: any, force = false) {
    // Pastikan data terbaru diambil jika force=true
    if (GAS_URL && force) {
      await this.fetchFromGAS(true);
    }
    
    const now = new Date();
    const todayStr = this.formatDate(now);
    
    const filteredSiswa = this.filterByRole(this.siswa, user);
    
    // Filter absensi hari ini dengan normalisasi tanggal yang ketat
    const absensiToday = this.absensi.filter(a => {
      const normalizedDate = this.formatDate(a.tanggal);
      return normalizedDate === todayStr;
    });
    
    // Pencocokan ID yang sangat fleksibel antara absensi dan siswa
    const relevantAbsensi = absensiToday.filter(a => {
      const aId = this.getEntityId(a);
      return filteredSiswa.some(s => this.getEntityId(s) === aId);
    });
    
    const getCount = (status: string, data: any[] = relevantAbsensi) => 
      data.filter(a => (a.status || '').toString().toUpperCase().trim() === status).length;

    const stats: any = {
      totalSiswa: filteredSiswa.length,
      hadirToday: getCount('HADIR'),
      terlambatToday: getCount('TERLAMBAT'),
      sakitToday: getCount('SAKIT'),
      izinToday: getCount('IZIN'),
      alfaToday: getCount('ALFA'),
      tidakHadirToday: Math.max(0, filteredSiswa.length - relevantAbsensi.length)
    };

    // Add detailed stats for Admin/Kepala Sekolah
    if (user.role === UserRole.ADMIN || user.role === UserRole.KEPALA_SEKOLAH) {
      const jenjangList = ['KB', 'TK', 'SD'];
      jenjangList.forEach(jenjang => {
        const siswaJenjang = this.siswa.filter(s => (s.jenjang || '').toString().toUpperCase() === jenjang);
        const absensiJenjang = absensiToday.filter(a => {
          const aId = this.getEntityId(a);
          return siswaJenjang.some(s => this.getEntityId(s) === aId);
        });

        stats[`total${jenjang}`] = siswaJenjang.length;
        stats[`hadir${jenjang}`] = absensiJenjang.filter(a => (a.status || '').toString().toUpperCase().trim() === 'HADIR').length;
        stats[`absen${jenjang}`] = Math.max(0, siswaJenjang.length - absensiJenjang.length);
      });
    }

    console.log(`[DASHBOARD] Stats for ${todayStr}:`, stats);
    return stats;
  }

  async getMonthlyDashboardStats(user: any, force = false) {
    if (GAS_URL && force) {
      await this.fetchFromGAS(true);
    }
    
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const filteredSiswa = this.filterByRole(this.siswa, user);
    
    // Filter absensi bulan ini
    const absensiMonth = this.absensi.filter(a => {
      const normalizedDate = this.formatDate(a.tanggal);
      return normalizedDate.startsWith(monthStr);
    });
    
    // Pencocokan ID
    const relevantAbsensi = absensiMonth.filter(a => {
      const aId = this.getEntityId(a);
      return filteredSiswa.some(s => this.getEntityId(s) === aId);
    });
    
    const getCount = (status: string, data: any[] = relevantAbsensi) => 
      data.filter(a => (a.status || '').toString().toUpperCase().trim() === status).length;

    const stats: any = {
      totalSiswa: filteredSiswa.length,
      hadirMonth: getCount('HADIR'),
      terlambatMonth: getCount('TERLAMBAT'),
      sakitMonth: getCount('SAKIT'),
      izinMonth: getCount('IZIN'),
      alfaMonth: getCount('ALFA'),
      monthName: now.toLocaleString('id-ID', { month: 'long', year: 'numeric' })
    };

    // Add detailed monthly stats for Admin/Kepala Sekolah
    if (user.role === UserRole.ADMIN || user.role === UserRole.KEPALA_SEKOLAH) {
      const jenjangList = ['KB', 'TK', 'SD'];
      jenjangList.forEach(jenjang => {
        const siswaJenjang = this.siswa.filter(s => (s.jenjang || '').toString().toUpperCase() === jenjang);
        const absensiJenjang = absensiMonth.filter(a => {
          const aId = this.getEntityId(a);
          return siswaJenjang.some(s => this.getEntityId(s) === aId);
        });

        stats[`total${jenjang}`] = siswaJenjang.length;
        stats[`hadir${jenjang}`] = absensiJenjang.filter(a => (a.status || '').toString().toUpperCase().trim() === 'HADIR').length;
        // Absen in monthly context usually means total days missed across all students in that jenjang
        // But here we might want "students who haven't attended at all this month" or just sum of absences
        // For simplicity and matching user request "siswa KB absen", we'll use daily-style logic or total absences
        stats[`absen${jenjang}`] = getCount('ALFA', absensiJenjang); 
      });
    }

    console.log(`[DASHBOARD] Monthly Stats for ${monthStr}:`, stats);
    return stats;
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
