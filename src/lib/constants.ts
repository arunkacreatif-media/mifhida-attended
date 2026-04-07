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
  KB: ['KB'],
  TK: ['TK'],
  SD: ['1', '2', '3', '4', '5', '6'],
};

export const ATTENDANCE_RULES = {
  START_TIME: '06:00',
  LATE_TIME: '07:15',
  END_TIME: '08:30',
};

export const ATTENDANCE_STATUS = {
  AUTO: 'AUTO',
  HADIR: 'HADIR',
  TERLAMBAT: 'TERLAMBAT',
  ALFA: 'ALFA',
  IZIN: 'IZIN',
  SAKIT: 'SAKIT',
};
