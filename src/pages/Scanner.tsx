/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  History,
  AlertCircle,
  Keyboard,
  Scan,
  Check,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { api } from '../services/api';
import { ATTENDANCE_STATUS } from '../lib/constants';
import Toast, { ToastType } from '../components/Toast';

export default function Scanner({ user }: { user: any }) {
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [manualId, setManualId] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState(ATTENDANCE_STATUS.HADIR);
  const [keterangan, setKeterangan] = useState('');
  const [autoSendWA, setAutoSendWA] = useState(false);
  const [toast, setToast] = useState<{ isVisible: boolean; message: string; type: ToastType }>({
    isVisible: false,
    message: '',
    type: 'success'
  });
  
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    fetchLogs();
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [user]);

  const fetchLogs = async (force = false) => {
    const data = await api.getAbsensiLogs(user, force);
    setLogs(data.slice(0, 10)); // Show last 10 logs
  };

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  const cleanPhone = (phone: string) => {
    if (!phone) return '';
    // Hapus semua karakter non-digit
    let cleaned = phone.toString().replace(/\D/g, '');
    // Jika dimulai dengan 0, ganti dengan 62
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    // Jika dimulai dengan 8 (tanpa kode negara), tambahkan 62
    else if (cleaned.startsWith('8')) {
      cleaned = '62' + cleaned;
    }
    return cleaned;
  };

  const sendWhatsApp = (data: any) => {
    const phone = cleanPhone(data.wa);
    if (!phone) {
      showToast('Nomor WhatsApp wali tidak ditemukan', 'error');
      return;
    }

    const statusEmoji = data.status.toUpperCase() === 'HADIR' ? '✅' : '⏰';
    const message = `*ABSENSI SISWA - YPI MH*\n\nAssalamu'alaikum Wr. Wb.\n\nMenginfokan bahwa ananda:\n👤 *${data.nama}*\n\nTelah melakukan absensi pada:\n📅 Hari/Tgl: ${today}\n⌚ Jam: ${data.jam}\n${statusEmoji} Status: *${data.status}*\n\nTerima kasih atas perhatiannya.\n\n_Pesan otomatis dari Sistem Absensi QR_`;
    
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const startScanner = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('Browser Anda tidak mendukung akses kamera. Gunakan Chrome atau Safari.', 'error');
      return;
    }

    setIsScanning(true);
    setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner(
          "reader",
          { 
            fps: 10, 
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const qrboxSize = Math.floor(minEdge * 0.7);
              return {
                width: qrboxSize,
                height: qrboxSize
              };
            },
            aspectRatio: 1.0,
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            videoConstraints: {
              facingMode: "user"
            }
          },
          /* verbose= */ false
        );
        
        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;
      } catch (err) {
        console.error("Scanner init error:", err);
        showToast('Gagal mengaktifkan kamera. Pastikan izin kamera diberikan.', 'error');
        setIsScanning(false);
      }
    }, 300);
  };

  const onScanSuccess = async (decodedText: string) => {
    if (scannerRef.current) {
      scannerRef.current.pause();
    }
    handleAttendance(decodedText);
  };

  const onScanFailure = (error: any) => {
    // console.warn(`Code scan error = ${error}`);
  };

  const playSuccessSound = () => {
    try {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (!AudioContextClass) return;
      
      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      // Frekuensi nada "ding" yang menyenangkan
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
      oscillator.frequency.exponentialRampToValueAtTime(1100, audioCtx.currentTime + 0.1); 

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.error("Audio error:", e);
    }
  };

  const handleAttendance = async (id: string) => {
    setError(null);
    try {
      const result = await api.submitAbsensi(id, attendanceStatus, keterangan);
      if (result.success) {
        playSuccessSound();
        setScanResult(result.data);
        showToast(`Data absensi ${result.data.nama} berhasil terkirim ke sistem`);
        fetchLogs(true);
        
        // Auto-send WA if enabled
        if (autoSendWA && result.data.wa) {
          sendWhatsApp(result.data);
        }
        
        // Auto-reset after 5 seconds if WA not clicked
        setTimeout(() => {
          setScanResult((prev: any) => {
            if (prev && prev.nama === result.data.nama) {
              if (scannerRef.current) scannerRef.current.resume();
              return null;
            }
            return prev;
          });
        }, 5000);
      } else {
        setError(result.message);
        showToast(result.message || 'Gagal mengirim absensi', 'error');
        setTimeout(() => setError(null), 3000);
        if (scannerRef.current) {
          scannerRef.current.resume();
        }
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem');
      showToast('Terjadi kesalahan sistem', 'error');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId) {
      handleAttendance(manualId);
      setManualId('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Scanner Section */}
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-8">
            <h2 className="text-[18px] font-black text-gray-900 flex items-center gap-3">
              <Scan className="text-emerald-600" />
              Scan QR Code
            </h2>
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setAttendanceStatus(ATTENDANCE_STATUS.HADIR)}
                className={`px-4 py-2 rounded-lg text-caption font-black transition-all ${attendanceStatus === ATTENDANCE_STATUS.HADIR ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500'}`}
              >
                HADIR
              </button>
              <button 
                onClick={() => setAttendanceStatus(ATTENDANCE_STATUS.TERLAMBAT)}
                className={`px-4 py-2 rounded-lg text-caption font-black transition-all ${attendanceStatus === ATTENDANCE_STATUS.TERLAMBAT ? 'bg-amber-600 text-white shadow-md' : 'text-gray-500'}`}
              >
                TERLAMBAT
              </button>
            </div>
          </div>

          <div className="w-full flex items-center justify-between mb-4 px-4 py-3 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${autoSendWA ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                <MessageSquare size={16} />
              </div>
              <div>
                <p className="text-caption font-black text-emerald-900">Kirim WA Otomatis</p>
                <p className="text-caption text-emerald-600 font-medium opacity-80">Buka WA setelah scan berhasil</p>
              </div>
            </div>
            <button 
              onClick={() => setAutoSendWA(!autoSendWA)}
              className={`w-12 h-6 rounded-full transition-all relative ${autoSendWA ? 'bg-emerald-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${autoSendWA ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          <div className="relative w-full aspect-square max-w-sm bg-gray-900 rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white group">
            {!isScanning ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <Camera size={40} className="text-emerald-400" />
                </div>
                <h4 className="text-xl font-bold mb-2">Kamera Siap</h4>
                <p className="text-gray-400 text-sm mb-8">Klik tombol di bawah untuk mulai memindai kartu siswa</p>
                <button 
                  onClick={startScanner}
                  className="px-8 py-4 bg-emerald-600 hover:bg-emerald-600 active:scale-95 rounded-2xl font-black transition-all shadow-lg shadow-emerald-900/40 mb-6"
                >
                  Aktifkan Kamera
                </button>
                
                <div className="flex flex-col items-center gap-2 opacity-60">
                  <p className="text-[10px] uppercase tracking-widest font-black">Masalah Kamera?</p>
                  <p className="text-[12px] font-medium max-w-[200px]">Pastikan buka di <span className="font-black text-emerald-400">Chrome/Safari</span> (Bukan dari WA/FB)</p>
                </div>
              </div>
            ) : (
              <div id="reader" className="w-full h-full"></div>
            )}

            {/* Overlay Result */}
            <AnimatePresence>
              {scanResult && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 bg-emerald-600/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-8 text-center z-10"
                >
                  <CheckCircle size={80} className="mb-6" />
                  <h4 className="text-[20px] font-black mb-2">BERHASIL!</h4>
                  <p className="text-[16px] font-bold text-emerald-100">{scanResult.nama}</p>
                  <p className="text-emerald-200 mt-2 text-body font-medium">Tercatat pukul {scanResult.jam}</p>
                  
                  <button 
                    onClick={() => sendWhatsApp(scanResult)}
                    className="mt-6 flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 rounded-2xl font-black shadow-xl hover:bg-emerald-50 transition-all active:scale-95"
                  >
                    <MessageSquare size={20} />
                    Kirim WhatsApp Wali
                  </button>
                  
                  <button 
                    onClick={() => {
                      setScanResult(null);
                      if (scannerRef.current) scannerRef.current.resume();
                    }}
                    className="mt-4 text-xs text-emerald-200 font-bold hover:text-white transition-colors"
                  >
                    Tutup (Otomatis dalam 5 detik)
                  </button>
                </motion.div>
              )}

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 bg-red-600/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-8 text-center z-10"
                >
                  <XCircle size={80} className="mb-6" />
                  <h4 className="text-3xl font-black mb-2">GAGAL</h4>
                  <p className="text-xl font-bold text-red-100">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-8 w-full">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px flex-1 bg-gray-100"></div>
              <span className="text-caption font-black text-gray-400 uppercase tracking-widest">Atau Input Manual</span>
              <div className="h-px flex-1 bg-gray-100"></div>
            </div>
            <form onSubmit={handleManualSubmit} className="flex gap-3">
              <div className="relative flex-1">
                <Keyboard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Masukkan ID Siswa (MH-xxx)"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value.toUpperCase())}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
                />
              </div>
              <button 
                type="submit"
                className="px-6 bg-emerald-800 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Logs Section */}
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 h-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[18px] font-black text-gray-900 flex items-center gap-3">
              <History className="text-emerald-600" />
              Riwayat Terakhir
            </h2>
            <button onClick={() => fetchLogs(true)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
              <RefreshCw size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="py-20 text-center text-gray-400">
                <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                <p>Belum ada aktivitas absensi hari ini</p>
              </div>
            ) : logs.map((log, index) => (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                key={`${log.idSiswa}-${log.jam}-${index}`}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md ${log.status === 'HADIR' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                  {log.status === 'HADIR' ? <Check size={24} /> : <Clock size={24} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-body font-black text-gray-900">{log.nama || log.idSiswa}</p>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => sendWhatsApp(log)}
                        className="p-1.5 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
                        title="Kirim WhatsApp"
                      >
                        <MessageSquare size={14} />
                      </button>
                      <span className="text-caption font-black px-2 py-1 bg-white rounded-lg text-gray-400 border border-gray-100">{log.jam}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-caption font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${log.status === 'HADIR' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {log.status}
                    </span>
                    {log.keterangan && <span className="text-caption text-gray-400 italic">"{log.keterangan}"</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100">
            <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
              <h4 className="font-black text-emerald-900 mb-2 flex items-center gap-2">
                <AlertCircle size={18} />
                Tips Scan
              </h4>
              <ul className="text-sm text-emerald-700 space-y-2 list-disc ml-4">
                <li>Pastikan pencahayaan cukup terang</li>
                <li>Posisikan QR Code tepat di dalam kotak</li>
                <li>Jaga jarak sekitar 15-20cm dari kamera</li>
                <li>Pastikan lensa kamera bersih</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <Toast 
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
}
