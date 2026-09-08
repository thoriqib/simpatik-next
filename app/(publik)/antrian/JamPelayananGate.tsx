'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ambilWaktuWIBSekarang, jadwalPelayananHariIniClient } from '@/lib/jam-pelayanan-client';
import { Clock, AlertTriangle, MoonStar, X } from 'lucide-react';

/**
 * [UPDATE] Sekarang pakai jadwal pelayanan resmi TETAP (lib/jam-pelayanan-client.ts)
 * — Senin–Kamis 08.00–15.30, Jumat 08.00–16.00, Sabtu–Minggu tutup total —
 * bukan lagi jam yang diturunkan dari shift_piket (props jamMulai/jamSelesai
 * dihapus, komponen ini sekarang menghitung sendiri).
 */
export function JamPelayananGate({ children }: { children: React.ReactNode }) {
    const [waktu, setWaktu] = useState<ReturnType<typeof ambilWaktuWIBSekarang> | null>(null);
    const [popupDitutup, setPopupDitutup] = useState(false);

    useEffect(() => {
        setWaktu(ambilWaktuWIBSekarang());
        const interval = setInterval(() => setWaktu(ambilWaktuWIBSekarang()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Belum sempat hydrate di client — tampilkan children apa adanya dulu
    // biar tidak ada flash/kedip; begitu waktu client siap, gate langsung
    // menyesuaikan dalam hitungan milidetik.
    if (!waktu) return <>{children}</>;

    const jadwal = jadwalPelayananHariIniClient();
    const totalMenit = waktu.jam * 60 + waktu.menit;

    // Tutup total: akhir pekan (jadwal.buka === false), ATAU blokir keras
    // 18:00–07:00 di hari kerja (di luar jam pelayanan resmi TERLALU jauh
    // untuk sekadar peringatan — langsung tutup form-nya).
    const diBlokirKeras = !jadwal.buka || waktu.jam >= 18 || waktu.jam < 7;

    // Di luar jam pelayanan resmi hari ini, TAPI belum masuk blokir keras
    // (mis. jam 07.15 di hari kerja — form tetap bisa dipakai + peringatan)
    let diLuarJamPelayanan = false;
    if (!diBlokirKeras && jadwal.buka) {
        const [mulaiH, mulaiM] = jadwal.jamMulai.split(':').map(Number);
        const [selesaiH, selesaiM] = jadwal.jamSelesai.split(':').map(Number);
        const mulaiMenit = mulaiH * 60 + mulaiM;
        const selesaiMenit = selesaiH * 60 + selesaiM;
        diLuarJamPelayanan = totalMenit < mulaiMenit || totalMenit >= selesaiMenit;
    }

    const jamStr = `${String(waktu.jam).padStart(2, '0')}:${String(waktu.menit).padStart(2, '0')}`;

    return (
        <div>
            {/* ── Jam realtime ── */}
            <div className="flex items-center justify-center gap-2 bg-navy-950 text-white rounded-xl px-4 py-3 mb-6 text-sm">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-mono tabular font-semibold">{jamStr} WIB</span>
                <span className="text-white/40">·</span>
                <span className="text-white/70">{waktu.label}</span>
            </div>

            {diBlokirKeras ? (
                // ── Blokir keras — form disembunyikan sepenuhnya ──
                <div className="bg-white rounded-2xl shadow-soft border border-paper-200 p-8 text-center">
                    <div className="w-16 h-16 bg-navy-950/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MoonStar className="w-8 h-8 text-navy-950/40" />
                    </div>
                    <h2 className="text-lg font-bold text-navy-950 mb-2">Pengambilan Antrian Ditutup</h2>
                    <p className="text-sm text-navy-950/50 max-w-sm mx-auto leading-relaxed">
                        {!jadwal.buka ? (
                            <>Tidak ada pelayanan pada hari <strong>Sabtu & Minggu</strong>. Silakan kembali pada hari kerja mulai pukul 08.00 WIB.</>
                        ) : (
                            <>Nomor antrian tidak bisa diambil pada pukul <strong>18.00–07.00 WIB</strong>. Silakan kembali besok pagi mulai pukul 07.00 WIB.</>
                        )}
                    </p>
                    <Link href="/" className="inline-block mt-6 text-sm text-azure-500 hover:text-navy-700 font-medium transition-colors">
                        ← Kembali ke Beranda
                    </Link>
                </div>
            ) : (
                <>
                    {diLuarJamPelayanan && !popupDitutup && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-sm">
                            <div className="bg-white rounded-2xl shadow-card max-w-sm w-full p-6 relative">
                                <button
                                    onClick={() => setPopupDitutup(true)}
                                    className="absolute top-4 right-4 text-navy-950/30 hover:text-navy-950 transition-colors"
                                    aria-label="Tutup"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-navy-950 mb-1.5">Di Luar Jam Pelayanan</h3>
                                <p className="text-sm text-navy-950/50 leading-relaxed mb-5">
                                    Jam pelayanan resmi kami adalah <strong className="text-navy-950">{jadwal.jamMulai}–{jadwal.jamSelesai} WIB</strong>.
                                    Anda tetap bisa mengambil nomor antrian sekarang, tapi kemungkinan
                                    petugas belum siap melayani sampai jam operasional dimulai.
                                </p>
                                <button
                                    onClick={() => setPopupDitutup(true)}
                                    className="w-full bg-navy-700 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-navy-800 transition-colors"
                                >
                                    Mengerti, Lanjutkan
                                </button>
                            </div>
                        </div>
                    )}
                    {children}
                </>
            )}
        </div>
    );
}
