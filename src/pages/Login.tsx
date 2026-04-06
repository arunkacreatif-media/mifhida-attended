/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { QrCode, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../services/api';
import { LOGOS } from '../lib/constants';

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.login(email, password);
      if (result.success) {
        onLogin(result.user);
      } else {
        setError(result.message || 'Login gagal');
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-900 relative overflow-hidden">
      {/* Islamic Pattern Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="islamic" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M50 0 L100 50 L50 100 L0 50 Z" fill="none" stroke="currentColor" strokeWidth="1" />
              <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamic)" />
        </svg>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl z-10 border border-white/20"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl shadow-xl mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-300 p-2 overflow-hidden">
            <img 
              src={LOGOS.SCHOOL} 
              alt="School Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-[20px] font-black text-emerald-900 tracking-tight">Miftahul Hidayah</h1>
          <p className="text-emerald-600 text-body font-medium mt-2">Sistem Absensi Digital QR Code</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm flex items-center gap-3 rounded-r-xl"
            >
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}

          <div className="space-y-2">
            <label className="text-caption font-bold text-emerald-900 ml-1">Email Sekolah</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl focus:border-emerald-500 focus:ring-0 transition-all outline-none text-emerald-900 text-body placeholder:text-emerald-300"
                placeholder="admin@gmail.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-caption font-bold text-emerald-900 ml-1">Kata Sandi</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={20} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl focus:border-emerald-500 focus:ring-0 transition-all outline-none text-emerald-900 text-body placeholder:text-emerald-300"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-800 hover:bg-emerald-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              'Masuk ke Sistem'
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-emerald-100 text-center">
          <p className="text-emerald-600 text-caption font-medium uppercase tracking-widest">
            Yayasan Pendidikan Islam Miftahul Hidayah
          </p>
          <p className="text-emerald-400 text-caption mt-1">
            KB • TK • SD Kelas 1-6
          </p>
        </div>
      </motion.div>
    </div>
  );
}
