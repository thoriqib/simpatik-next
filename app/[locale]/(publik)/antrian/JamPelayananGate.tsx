'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { ambilWaktuWIBSekarang, jadwalPelayananHariIniClient } from '@/lib/jam-pelayanan-client';
import { useTranslations, useLocale } from 'next-intl';
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
    const t = useTranslations('antrian.gate');
    const locale = useLocale();
    const localeLabel = locale === 'en' ? 'en-US' : 'id-ID';

    useEffect(() => {
        setWaktu(ambilWaktuWIBSekarang(localeLabel));
        const interval = setInterval(() => setWaktu(ambilWaktuWIBSekarang(localeLabel)), 1000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localeLabel]);

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
                    <h2 className="text-lg font-bold text-navy-950 mb-2">{t('closedTitle')}</h2>
                    <p className="text-sm text-navy-950/50 max-w-sm mx-auto leading-relaxed">
                        {!jadwal.buka ? t('closedWeekend') : t('closedNight')}
                    </p>
                    <Link href="/" className="inline-block mt-6 text-sm text-azure-500 hover:text-navy-700 font-medium transition-colors">
                        ← {t('backHome')}
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
                                    aria-label="Close"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-navy-950 mb-1.5">{t('outsideHoursTitle')}</h3>
                                <p className="text-sm text-navy-950/50 leading-relaxed mb-5">
                                    {t('outsideHoursDesc', { jamMulai: jadwal.jamMulai, jamSelesai: jadwal.jamSelesai })}
                                </p>
                                <button
                                    onClick={() => setPopupDitutup(true)}
                                    className="w-full bg-navy-700 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-navy-800 transition-colors"
                                >
                                    {t('understand')}
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
