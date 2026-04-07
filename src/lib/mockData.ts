/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRole } from './constants';

export const INITIAL_USERS = [
  { email: 'arunkacreatif@gmail.com', password: 'admin123', role: UserRole.ADMIN, nama: 'Administrator Yayasan' },
  { email: 'admin@gmail.com', password: 'admin123', role: UserRole.ADMIN, nama: 'Administrator Yayasan' },
  { email: 'guru1@gmail.com', password: 'guru123', role: UserRole.WALI_KELAS, nama: 'Ustadzah Fatimah' },
  { email: 'guru2@gmail.com', password: 'guru123', role: UserRole.WALI_KELAS, nama: 'Ustadz Ahmad' },
  { email: 'kepala@gmail.com', password: 'kepala123', role: UserRole.KEPALA_SEKOLAH, nama: 'H. Muhammad Yusuf' },
];

export const INITIAL_SISWA = [
  { id: 'MH-001', nama: 'Ahmad Zaki Al-Fatih', kelas: 'KB-A', jenjang: 'KB', wali: 'Bp. Ridwan', wa: '628123456789', foto: '', createdAt: new Date().toISOString() },
  { id: 'MH-002', nama: 'Siti Aminah Zahra', kelas: 'TK-B', jenjang: 'TK', wali: 'Ibu Sarah', wa: '628123456790', foto: '', createdAt: new Date().toISOString() },
  { id: 'MH-003', nama: 'Fatih Al-Fatih', kelas: '1-A', jenjang: 'SD', wali: 'Bp. Usman', wa: '628123456791', foto: '', createdAt: new Date().toISOString() },
  { id: 'MH-004', nama: 'Aisyah Humaira', kelas: '2-B', jenjang: 'SD', wali: 'Ibu Khadijah', wa: '628123456792', foto: '', createdAt: new Date().toISOString() },
  { id: 'MH-005', nama: 'Hasan Basri', kelas: '3-A', jenjang: 'SD', wali: 'Bp. Ali', wa: '628123456793', foto: '', createdAt: new Date().toISOString() },
  { id: 'MH-006', nama: 'Husain Mansur', kelas: '4-B', jenjang: 'SD', wali: 'Bp. Umar', wa: '628123456794', foto: '', createdAt: new Date().toISOString() },
  { id: 'MH-007', nama: 'Maryam Jamilah', kelas: '5-A', jenjang: 'SD', wali: 'Ibu Maryam', wa: '628123456795', foto: '', createdAt: new Date().toISOString() },
  { id: 'MH-008', nama: 'Yahya Zakaria', kelas: '6-B', jenjang: 'SD', wali: 'Bp. Zakaria', wa: '628123456796', foto: '', createdAt: new Date().toISOString() },
  { id: 'MH-009', nama: 'Ibrahim Khalil', kelas: '1-B', jenjang: 'SD', wali: 'Bp. Ibrahim', wa: '628123456797', foto: '', createdAt: new Date().toISOString() },
  { id: 'MH-010', nama: 'Sarah Shofia', kelas: 'TK-A', jenjang: 'TK', wali: 'Ibu Sarah', wa: '628123456798', foto: '', createdAt: new Date().toISOString() },
];

export const INITIAL_ABSENSI = [
  { idSiswa: 'MH-001', tanggal: new Date().toISOString().split('T')[0], jam: '07:15:00', status: 'HADIR', keterangan: '' },
  { idSiswa: 'MH-002', tanggal: new Date().toISOString().split('T')[0], jam: '07:20:00', status: 'HADIR', keterangan: '' },
  { idSiswa: 'MH-003', tanggal: new Date().toISOString().split('T')[0], jam: '07:45:00', status: 'TERLAMBAT', keterangan: 'Macet' },
];
