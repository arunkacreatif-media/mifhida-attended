/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { LOGOS } from '../lib/constants';
import { Info, Code, ShieldCheck, Zap, Heart, ExternalLink } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      {/* App Info Section */}
      <section className="text-center space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block p-4 bg-white rounded-[2rem] shadow-xl mb-4"
        >
          <img 
            src={LOGOS.SCHOOL} 
            alt="School Logo" 
            className="w-32 h-32 object-contain"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[20px] font-black text-emerald-900"
        >
          Absensi Digital Miftahul Hidayah
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-body text-gray-600 leading-relaxed"
        >
          Solusi manajemen kehadiran modern berbasis QR Code yang dirancang khusus untuk 
          Yayasan Pendidikan Islam Miftahul Hidayah. Aplikasi ini mengintegrasikan teknologi 
          pemindaian cepat dengan sistem pelaporan yang akurat untuk mendukung efisiensi 
          operasional sekolah di jenjang KB, TK, dan SD.
        </motion.p>
      </section>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard 
          icon={Zap} 
          title="Cepat & Ringan" 
          desc="Optimasi performa tinggi untuk penggunaan di berbagai perangkat mobile."
          delay={0.3}
        />
        <FeatureCard 
          icon={ShieldCheck} 
          title="Aman & Terpercaya" 
          desc="Sistem login berbasis peran (RBAC) untuk menjaga integritas data sekolah."
          delay={0.4}
        />
        <FeatureCard 
          icon={Heart} 
          title="User Friendly" 
          desc="Antarmuka yang intuitif dan mudah digunakan oleh guru maupun staf."
          delay={0.5}
        />
      </div>

      {/* Developer Profile Section */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="bg-white rounded-[3rem] p-10 shadow-xl border border-emerald-50 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-shrink-0">
            <div className="p-4 bg-white rounded-[2rem] shadow-lg border border-gray-100">
              <img 
                src={LOGOS.DEVELOPER} 
                alt="Developer Logo" 
                className="w-48 h-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-caption font-black uppercase tracking-widest">
              <Code size={14} />
              Developer Profile
            </div>
            <h2 className="text-[18px] font-black text-gray-900">Tentang Pengembang</h2>
            <p className="text-body text-gray-600 leading-relaxed">
              Aplikasi ini dikembangkan oleh tim profesional yang berdedikasi untuk memajukan 
              digitalisasi pendidikan di Indonesia. Kami berfokus pada pengembangan solusi 
              perangkat lunak yang praktis, inovatif, dan berdampak positif bagi institusi pendidikan.
            </p>
            <div className="pt-4 flex flex-wrap justify-center md:justify-start gap-4">
              <a 
                href="#" 
                className="flex items-center gap-2 px-6 py-3 bg-emerald-800 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20"
              >
                Hubungi Kami
                <ExternalLink size={18} />
              </a>
              <div className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold">
                v1.0.0 Stable
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Footer Branding */}
      <footer className="text-center pt-10 border-t border-gray-100">
        <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">
          Powered by Miftahul Hidayah Digital Team
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100/50 hover:bg-white hover:shadow-xl transition-all group"
    >
      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-md mb-6 group-hover:scale-110 transition-transform">
        <Icon size={28} />
      </div>
      <h3 className="text-[16px] font-black text-emerald-900 mb-3">{title}</h3>
      <p className="text-gray-500 text-body leading-relaxed">{desc}</p>
    </motion.div>
  );
}
