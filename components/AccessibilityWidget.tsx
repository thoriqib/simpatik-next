'use client';

import { useState, useEffect } from 'react';
import { Accessibility, X, Check } from 'lucide-react';

const KEY_UKURAN = 'simpatik-ukuran-font';
const KEY_KONTRAS = 'simpatik-kontras-tinggi';

const UKURAN_OPSI = [
    { value: 'normal', label: 'A', kelas: '' },
    { value: 'besar', label: 'A+', kelas: 'ukuran-besar' },
    { value: 'sangat-besar', label: 'A++', kelas: 'ukuran-sangat-besar' },
] as const;

/**
 * Widget aksesibilitas — mengambang di seluruh halaman (dipasang di
 * root layout), tersedia untuk pengunjung publik MAUPUN petugas/admin
 * yang sudah login. Preferensi disimpan di localStorage (aman dipakai
 * di aplikasi Next.js sungguhan — beda dengan pembatasan localStorage
 * di lingkungan artifact/sandbox chat).
 *
 * Penerapan ukuran font: mengubah font-size akar (<html>) lewat class
 * global di globals.css — karena Tailwind pakai satuan rem secara
 * default, SEMUA ukuran teks di seluruh aplikasi ikut skala proporsional
 * tanpa perlu sentuh satu-per-satu komponen.
 *
 * Penerapan kontras tinggi: filter CSS broad-stroke (contrast + saturate)
 * di <html> — pendekatan pragmatis yang menaikkan keterbacaan tanpa
 * perlu merombak warna di ratusan komponen satu-per-satu.
 */
export function AccessibilityWidget() {
    const [buka, setBuka] = useState(false);
    const [ukuran, setUkuran] = useState<'normal' | 'besar' | 'sangat-besar'>('normal');
    const [kontrasTinggi, setKontrasTinggi] = useState(false);
    const [siap, setSiap] = useState(false);

    // Muat preferensi tersimpan SETELAH mount (client-only) — hindari
    // hydration mismatch, sedikit "flash" ke pengaturan tersimpan itu
    // wajar & lazim untuk preferensi berbasis localStorage semacam ini.
    useEffect(() => {
        const ukuranTersimpan = localStorage.getItem(KEY_UKURAN) as typeof ukuran | null;
        const kontrasTersimpan = localStorage.getItem(KEY_KONTRAS) === '1';
        if (ukuranTersimpan) setUkuran(ukuranTersimpan);
        setKontrasTinggi(kontrasTersimpan);
        setSiap(true);
    }, []);

    useEffect(() => {
        if (!siap) return;
        const root = document.documentElement;
        root.classList.remove('ukuran-besar', 'ukuran-sangat-besar');
        const opsi = UKURAN_OPSI.find((o) => o.value === ukuran);
        if (opsi?.kelas) root.classList.add(opsi.kelas);
        localStorage.setItem(KEY_UKURAN, ukuran);
    }, [ukuran, siap]);

    useEffect(() => {
        if (!siap) return;
        document.documentElement.classList.toggle('kontras-tinggi', kontrasTinggi);
        localStorage.setItem(KEY_KONTRAS, kontrasTinggi ? '1' : '0');
    }, [kontrasTinggi, siap]);

    return (
        <div className="fixed bottom-5 right-5 z-[60] print:hidden">
            {buka && (
                <div className="absolute bottom-14 right-0 w-64 bg-white rounded-2xl shadow-card border border-paper-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-navy-950">Aksesibilitas</span>
                        <button onClick={() => setBuka(false)} className="text-navy-950/40 hover:text-navy-950">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="mb-4">
                        <div className="text-xs text-navy-950/50 mb-2">Ukuran Teks</div>
                        <div className="grid grid-cols-3 gap-1.5">
                            {UKURAN_OPSI.map((opsi) => (
                                <button
                                    key={opsi.value}
                                    onClick={() => setUkuran(opsi.value)}
                                    className={`py-2 rounded-lg text-sm font-bold border transition-colors ${
                                        ukuran === opsi.value
                                            ? 'bg-navy-700 text-white border-navy-700'
                                            : 'bg-paper-50 text-navy-950/60 border-paper-200 hover:bg-paper-100'
                                    }`}
                                >
                                    {opsi.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <button
                            onClick={() => setKontrasTinggi(!kontrasTinggi)}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-paper-50 border border-paper-200 hover:bg-paper-100 transition-colors"
                        >
                            <span className="text-sm text-navy-950">Kontras Tinggi</span>
                            <span className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${kontrasTinggi ? 'bg-navy-700' : 'bg-paper-200'}`}>
                                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${kontrasTinggi ? 'left-[18px]' : 'left-0.5'}`} />
                            </span>
                        </button>
                    </div>

                    {(ukuran !== 'normal' || kontrasTinggi) && (
                        <div className="mt-3 pt-3 border-t border-paper-100 flex items-center gap-1.5 text-xs text-emerald-600">
                            <Check className="w-3.5 h-3.5" />
                            Pengaturan tersimpan otomatis
                        </div>
                    )}
                </div>
            )}

            <button
                onClick={() => setBuka(!buka)}
                aria-label="Buka pengaturan aksesibilitas"
                className="w-12 h-12 rounded-full bg-navy-700 text-white shadow-card flex items-center justify-center hover:bg-navy-800 transition-colors"
            >
                <Accessibility className="w-5 h-5" />
            </button>
        </div>
    );
}
