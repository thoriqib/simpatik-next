'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Accessibility, X, Check, Volume2, Square, RotateCcw, Moon, Sun, MonitorSmartphone } from 'lucide-react';

/**
 * Widget aksesibilitas — mengambang di seluruh halaman (root layout), tersedia untuk
 * pengunjung publik MAUPUN petugas/admin. Preferensi disimpan di localStorage.
 *
 * Fitur:
 *  - Ukuran teks (A / A+ / A++) — mengubah font-size akar, semua rem ikut skala
 *  - Kontras tinggi, skala abu-abu, warna terbalik (filter CSS pada <html>)
 *  - Spasi teks longgar, font mudah dibaca, sorot tautan, fokus keyboard tebal,
 *    kursor besar, hentikan animasi (class di <html>, aturannya ada di globals.css)
 *  - Pemandu baca (pita sorot yang mengikuti kursor/jari)
 *  - Bacakan teks (Web Speech API bawaan browser, gratis): teks yang diblok, atau seluruh isi halaman
 *  - Tema: Terang / Gelap / Otomatis (ikuti perangkat) + tombol cepat bulan/matahari. Disimpan di
 *    kunci terpisah 'simpatik-tema' karena dibaca skrip anti-kedip di <head> (app/layout.tsx)
 *  - Setel ulang semua
 *
 * Label mengikuti bahasa halaman: URL berawalan /en → Inggris, selain itu Indonesia
 * (area admin/petugas memang Indonesia saja).
 */

const KEY = 'simpatik-aksesibilitas';
const KEY_TEMA = 'simpatik-tema';
type Tema = 'terang' | 'gelap' | 'otomatis';
// Kunci lama (versi sebelumnya) — tetap dibaca supaya preferensi pengguna lama tidak hilang
const KEY_UKURAN_LAMA = 'simpatik-ukuran-font';
const KEY_KONTRAS_LAMA = 'simpatik-kontras-tinggi';

type Ukuran = 'normal' | 'besar' | 'sangat-besar';
type Pengaturan = {
    ukuran: Ukuran;
    kontras: boolean;
    abu: boolean;
    terbalik: boolean;
    spasi: boolean;
    font: boolean;
    tautan: boolean;
    fokus: boolean;
    kursor: boolean;
    animasi: boolean; // true = animasi DIHENTIKAN
    pemandu: boolean;
};

const AWAL: Pengaturan = {
    ukuran: 'normal', kontras: false, abu: false, terbalik: false, spasi: false,
    font: false, tautan: false, fokus: false, kursor: false, animasi: false, pemandu: false,
};

const KELAS_UKURAN: Record<Ukuran, string> = { normal: '', besar: 'ukuran-besar', 'sangat-besar': 'ukuran-sangat-besar' };

// [kunci pengaturan, kelas di <html>] untuk fitur on/off yang murni class CSS
const TOGGLE_KELAS: [keyof Pengaturan, string][] = [
    ['kontras', 'kontras-tinggi'],
    ['spasi', 'spasi-lebar'],
    ['font', 'font-mudah-baca'],
    ['tautan', 'sorot-tautan'],
    ['fokus', 'fokus-jelas'],
    ['kursor', 'kursor-besar'],
    ['animasi', 'tanpa-animasi'],
];

const TEKS = {
    id: {
        tema: 'Tema', terang: 'Terang', gelap: 'Gelap', otomatis: 'Otomatis', modeGelap: 'Aktifkan mode gelap', modeTerang: 'Aktifkan mode terang',
        judul: 'Aksesibilitas', buka: 'Buka pengaturan aksesibilitas', tutup: 'Tutup',
        ukuran: 'Ukuran Teks', tampilan: 'Tampilan', bacaan: 'Membaca', gerak: 'Gerak & Navigasi',
        kontras: 'Kontras Tinggi', abu: 'Skala Abu-abu', terbalik: 'Warna Terbalik',
        spasi: 'Spasi Teks Longgar', font: 'Font Mudah Dibaca', tautan: 'Sorot Tautan',
        pemandu: 'Pemandu Baca', fokus: 'Fokus Keyboard Tebal', kursor: 'Kursor Besar',
        animasi: 'Hentikan Animasi',
        bacakan: 'Bacakan Halaman', bacakanTerpilih: 'Bacakan Teks Terpilih', berhenti: 'Berhenti Membaca',
        bacaanHint: 'Blok sebagian teks lebih dulu untuk membacakan bagian itu saja.',
        reset: 'Setel Ulang Semua', tersimpan: 'Pengaturan tersimpan otomatis', lang: 'id-ID',
    },
    en: {
        tema: 'Theme', terang: 'Light', gelap: 'Dark', otomatis: 'Auto', modeGelap: 'Switch to dark mode', modeTerang: 'Switch to light mode',
        judul: 'Accessibility', buka: 'Open accessibility settings', tutup: 'Close',
        ukuran: 'Text Size', tampilan: 'Display', bacaan: 'Reading', gerak: 'Motion & Navigation',
        kontras: 'High Contrast', abu: 'Grayscale', terbalik: 'Invert Colors',
        spasi: 'Wider Text Spacing', font: 'Easy-to-Read Font', tautan: 'Highlight Links',
        pemandu: 'Reading Guide', fokus: 'Bold Keyboard Focus', kursor: 'Large Cursor',
        animasi: 'Stop Animations',
        bacakan: 'Read Page Aloud', bacakanTerpilih: 'Read Selected Text', berhenti: 'Stop Reading',
        bacaanHint: 'Select some text first to read only that part.',
        reset: 'Reset All', tersimpan: 'Settings are saved automatically', lang: 'en-US',
    },
} as const;

/** Pecah teks panjang jadi potongan ≤ ~220 karakter di batas kalimat — Chrome menghentikan ucapan yang terlalu panjang. */
function potongTeks(teks: string): string[] {
    const kalimat = teks.replace(/\s+/g, ' ').trim().match(/[^.!?\n]+[.!?]*\s*/g) ?? [];
    const hasil: string[] = [];
    let buf = '';
    for (const k of kalimat) {
        if ((buf + k).length > 220 && buf) { hasil.push(buf.trim()); buf = ''; }
        buf += k;
    }
    if (buf.trim()) hasil.push(buf.trim());
    return hasil;
}

function Saklar({ aktif, label, onKlik }: { aktif: boolean; label: string; onKlik: () => void }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={aktif}
            onClick={onKlik}
            className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-paper-50 border border-paper-200 hover:bg-paper-100 transition-colors text-left"
        >
            <span className="text-sm text-navy-950">{label}</span>
            <span className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${aktif ? 'bg-navy-700' : 'bg-paper-200'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${aktif ? 'left-[18px]' : 'left-0.5'}`} />
            </span>
        </button>
    );
}

function Judul({ children }: { children: React.ReactNode }) {
    return <div className="text-[11px] font-semibold uppercase tracking-wide text-navy-950/40 mb-1.5">{children}</div>;
}

export function AccessibilityWidget() {
    const pathname = usePathname() ?? '';
    const bahasa = pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'id';
    const T = TEKS[bahasa];

    const [buka, setBuka] = useState(false);
    const [p, setP] = useState<Pengaturan>(AWAL);
    const [siap, setSiap] = useState(false);
    const [tema, setTema] = useState<Tema>('terang');
    const [gelapAktif, setGelapAktif] = useState(false);
    const [membaca, setMembaca] = useState(false);
    const [bisaBicara, setBisaBicara] = useState(false);
    const [posisiPemandu, setPosisiPemandu] = useState(-100);
    const antrianBaca = useRef(0); // penanda sesi bacaan, supaya ucapan lama yang dibatalkan tidak melanjutkan

    // Muat preferensi tersimpan SETELAH mount (client-only) — hindari hydration mismatch.
    useEffect(() => {
        try {
            const baru = localStorage.getItem(KEY);
            if (baru) {
                setP({ ...AWAL, ...JSON.parse(baru) });
            } else {
                const ukuranLama = localStorage.getItem(KEY_UKURAN_LAMA) as Ukuran | null;
                setP({
                    ...AWAL,
                    ukuran: ukuranLama && ukuranLama in KELAS_UKURAN ? ukuranLama : 'normal',
                    kontras: localStorage.getItem(KEY_KONTRAS_LAMA) === '1',
                });
            }
        } catch { /* localStorage tidak tersedia / JSON rusak → pakai bawaan */ }
        try {
            const t = localStorage.getItem(KEY_TEMA);
            if (t === 'gelap' || t === 'otomatis' || t === 'terang') setTema(t);
        } catch { /* abaikan */ }
        setBisaBicara(typeof window !== 'undefined' && 'speechSynthesis' in window);
        setSiap(true);
    }, []);

    // Terapkan ke <html> + simpan
    useEffect(() => {
        if (!siap) return;
        const root = document.documentElement;
        root.classList.remove('ukuran-besar', 'ukuran-sangat-besar');
        if (KELAS_UKURAN[p.ukuran]) root.classList.add(KELAS_UKURAN[p.ukuran]);
        for (const [kunci, kelas] of TOGGLE_KELAS) root.classList.toggle(kelas, Boolean(p[kunci]));

        // Filter digabung dalam SATU properti supaya kontras/abu-abu/terbalik bisa aktif bersamaan
        const filter = [
            p.kontras ? 'contrast(1.25) saturate(0.9)' : '',
            p.abu ? 'grayscale(1)' : '',
            p.terbalik ? 'invert(1) hue-rotate(180deg)' : '',
        ].filter(Boolean).join(' ');
        root.style.filter = filter;

        try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* abaikan */ }
    }, [p, siap]);

    // Tema: terapkan class "dark" di <html>; mode otomatis mengikuti perangkat secara langsung
    useEffect(() => {
        if (!siap) return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const terapkan = () => {
            const gelap = tema === 'gelap' || (tema === 'otomatis' && mq.matches);
            document.documentElement.classList.toggle('dark', gelap);
            setGelapAktif(gelap);
        };
        terapkan();
        try { localStorage.setItem(KEY_TEMA, tema); } catch { /* abaikan */ }
        if (tema !== 'otomatis') return;
        mq.addEventListener('change', terapkan);
        return () => mq.removeEventListener('change', terapkan);
    }, [tema, siap]);

    // Pemandu baca: pita yang mengikuti kursor / jari
    useEffect(() => {
        if (!p.pemandu) return;
        const gerak = (e: MouseEvent) => setPosisiPemandu(e.clientY);
        const sentuh = (e: TouchEvent) => { if (e.touches[0]) setPosisiPemandu(e.touches[0].clientY); };
        window.addEventListener('mousemove', gerak);
        window.addEventListener('touchmove', sentuh, { passive: true });
        window.addEventListener('touchstart', sentuh, { passive: true });
        return () => {
            window.removeEventListener('mousemove', gerak);
            window.removeEventListener('touchmove', sentuh);
            window.removeEventListener('touchstart', sentuh);
        };
    }, [p.pemandu]);

    const berhenti = useCallback(() => {
        antrianBaca.current += 1;
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
        setMembaca(false);
    }, []);

    // Hentikan suara kalau halaman berpindah atau komponen dilepas
    useEffect(() => { berhenti(); }, [pathname, berhenti]);
    useEffect(() => () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }, []);

    const bacakan = () => {
        if (!bisaBicara) return;
        berhenti();
        const terpilih = window.getSelection()?.toString().trim();
        const sumber = terpilih || (document.querySelector('main') as HTMLElement | null)?.innerText || document.body.innerText;
        const potongan = potongTeks(sumber.slice(0, 8000));
        if (potongan.length === 0) return;

        const sesi = ++antrianBaca.current;
        setMembaca(true);
        potongan.forEach((teks, i) => {
            const u = new SpeechSynthesisUtterance(teks);
            u.lang = T.lang;
            u.rate = 0.95;
            const selesai = () => { if (antrianBaca.current === sesi && i === potongan.length - 1) setMembaca(false); };
            u.onend = selesai;
            u.onerror = selesai;
            window.speechSynthesis.speak(u);
        });
    };

    const ubah = <K extends keyof Pengaturan>(k: K, v: Pengaturan[K]) => setP((s) => ({ ...s, [k]: v }));
    const balik = (k: keyof Pengaturan) => setP((s) => ({ ...s, [k]: !s[k] }));
    const adaPerubahan = JSON.stringify(p) !== JSON.stringify(AWAL) || tema !== 'terang';

    const setelUlang = () => {
        berhenti();
        setP(AWAL);
        setTema('terang');
    };

    return (
        <>
            {/* Pita pemandu baca */}
            {p.pemandu && (
                <div
                    aria-hidden="true"
                    className="fixed left-0 right-0 z-[55] pointer-events-none print:hidden"
                    style={{ top: Math.max(posisiPemandu - 22, 0), height: 44, background: 'rgb(245 158 11 / 0.18)', borderTop: '2px solid rgb(245 158 11 / 0.8)', borderBottom: '2px solid rgb(245 158 11 / 0.8)' }}
                />
            )}

            <div className="fixed bottom-5 right-5 z-[60] print:hidden">
                {buka && (
                    <div
                        role="dialog"
                        aria-label={T.judul}
                        className="absolute bottom-14 right-0 w-72 max-h-[75vh] overflow-y-auto bg-white rounded-2xl shadow-card border border-paper-200 p-4"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-navy-950">{T.judul}</span>
                            <button type="button" onClick={() => setBuka(false)} aria-label={T.tutup} className="text-navy-950/40 hover:text-navy-950">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <Judul>{T.tema}</Judul>
                            <div className="grid grid-cols-3 gap-1.5">
                                {([['terang', T.terang, Sun], ['gelap', T.gelap, Moon], ['otomatis', T.otomatis, MonitorSmartphone]] as const).map(([nilai, label, Ikon]) => (
                                    <button
                                        key={nilai}
                                        type="button"
                                        aria-pressed={tema === nilai}
                                        onClick={() => setTema(nilai)}
                                        className={`flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                                            tema === nilai
                                                ? 'bg-navy-700 text-white border-navy-700'
                                                : 'bg-paper-50 text-navy-950/60 border-paper-200 hover:bg-paper-100'
                                        }`}
                                    >
                                        <Ikon className="w-4 h-4" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <Judul>{T.ukuran}</Judul>
                            <div className="grid grid-cols-3 gap-1.5">
                                {([['normal', 'A'], ['besar', 'A+'], ['sangat-besar', 'A++']] as const).map(([nilai, label]) => (
                                    <button
                                        key={nilai}
                                        type="button"
                                        aria-pressed={p.ukuran === nilai}
                                        onClick={() => ubah('ukuran', nilai)}
                                        className={`py-2 rounded-lg text-sm font-bold border transition-colors ${
                                            p.ukuran === nilai
                                                ? 'bg-navy-700 text-white border-navy-700'
                                                : 'bg-paper-50 text-navy-950/60 border-paper-200 hover:bg-paper-100'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4 space-y-1.5">
                            <Judul>{T.tampilan}</Judul>
                            <Saklar aktif={p.kontras} label={T.kontras} onKlik={() => balik('kontras')} />
                            <Saklar aktif={p.abu} label={T.abu} onKlik={() => balik('abu')} />
                            <Saklar aktif={p.terbalik} label={T.terbalik} onKlik={() => balik('terbalik')} />
                            <Saklar aktif={p.font} label={T.font} onKlik={() => balik('font')} />
                            <Saklar aktif={p.spasi} label={T.spasi} onKlik={() => balik('spasi')} />
                        </div>

                        <div className="mb-4 space-y-1.5">
                            <Judul>{T.gerak}</Judul>
                            <Saklar aktif={p.tautan} label={T.tautan} onKlik={() => balik('tautan')} />
                            <Saklar aktif={p.fokus} label={T.fokus} onKlik={() => balik('fokus')} />
                            <Saklar aktif={p.kursor} label={T.kursor} onKlik={() => balik('kursor')} />
                            <Saklar aktif={p.animasi} label={T.animasi} onKlik={() => balik('animasi')} />
                        </div>

                        <div className="mb-4 space-y-1.5">
                            <Judul>{T.bacaan}</Judul>
                            <Saklar aktif={p.pemandu} label={T.pemandu} onKlik={() => balik('pemandu')} />
                            {bisaBicara && (
                                <>
                                    <button
                                        type="button"
                                        onClick={membaca ? berhenti : bacakan}
                                        className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                                            membaca ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100' : 'bg-navy-700 text-white hover:bg-navy-800'
                                        }`}
                                    >
                                        {membaca ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                        {membaca ? T.berhenti : T.bacakan}
                                    </button>
                                    <p className="text-[11px] text-navy-950/40 leading-snug">{T.bacaanHint}</p>
                                </>
                            )}
                        </div>

                        <div className="pt-3 border-t border-paper-100 flex items-center justify-between gap-2">
                            {adaPerubahan ? (
                                <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                                    <Check className="w-3.5 h-3.5" />
                                    {T.tersimpan}
                                </span>
                            ) : <span />}
                            <button
                                type="button"
                                onClick={setelUlang}
                                disabled={!adaPerubahan}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-navy-950/60 hover:text-navy-950 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                {T.reset}
                            </button>
                        </div>
                    </div>
                )}

                {/* Tombol cepat tema (bulan/matahari) di atas tombol aksesibilitas */}
                <button
                    type="button"
                    onClick={() => setTema(gelapAktif ? 'terang' : 'gelap')}
                    aria-label={gelapAktif ? T.modeTerang : T.modeGelap}
                    title={gelapAktif ? T.modeTerang : T.modeGelap}
                    className="absolute bottom-14 right-1 mb-2 w-10 h-10 rounded-full bg-white text-navy-950 border border-paper-200 shadow-card flex items-center justify-center hover:bg-paper-100 transition-colors"
                    style={{ display: buka ? 'none' : undefined }}
                >
                    {gelapAktif ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                <button
                    type="button"
                    onClick={() => setBuka(!buka)}
                    aria-label={T.buka}
                    aria-expanded={buka}
                    className="w-12 h-12 rounded-full bg-navy-700 text-white shadow-card flex items-center justify-center hover:bg-navy-800 transition-colors"
                >
                    <Accessibility className="w-5 h-5" />
                </button>
            </div>
        </>
    );
}
