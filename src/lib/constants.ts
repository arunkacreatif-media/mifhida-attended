/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const LOGOS = {
  SCHOOL: 'https://res.cloudinary.com/maswardi/image/upload/q_auto/f_auto/v1770822838/mifhida_hretkz.png',
  DEVELOPER: 'https://res.cloudinary.com/maswardi/image/upload/q_auto/f_auto/v1768753170/akm_500_x_300_px_op0l8f.png',
};

export const COLORS = {
  emerald: '#065f46', // Emerald 800
  emeraldLight: '#10b981', // Emerald 500
  gold: '#d4af37', // Metallic Gold
  goldLight: '#fcd34d', // Amber 300
  white: '#ffffff',
  gray: '#f3f4f6',
};

export enum UserRole {
  ADMIN = 'ADMIN',
  WALI_KELAS = 'WALI_KELAS',
  KEPALA_SEKOLAH = 'KEPALA_SEKOLAH',
}

export const JENJANG = ['KB', 'TK', 'SD'];
export const KELAS = {
  KB: ['KB-A', 'KB-B'],
  TK: ['TK-A', 'TK-B'],
  SD: ['1-A', '1-B', '2-A', '2-B', '3-A', '3-B', '4-A', '4-B', '5-A', '5-B', '6-A', '6-B'],
};

export const ATTENDANCE_STATUS = {
  HADIR: 'HADIR',
  TERLAMBAT: 'TERLAMBAT',
  ALFA: 'ALFA',
  IZIN: 'IZIN',
  SAKIT: 'SAKIT',
};
