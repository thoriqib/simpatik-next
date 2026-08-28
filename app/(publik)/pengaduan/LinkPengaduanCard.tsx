'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Copy, Check, ExternalLink, KeyRound } from 'lucide-react';

/**
 * Menampilkan LINK lacak DAN kode TOKEN mentahnya secara terpisah —
 * masing-masing bisa disalin sendiri. Pengaduan bersifat anonim (tidak
 * ada email tersimpan), jadi salah satu dari dua ini adalah SATU-SATUNYA
 * cara pengadu bisa mengakses kembali percakapannya — menampilkan
 * keduanya secara eksplisit memberi pengadu pilihan mana yang lebih
 * mudah mereka simpan/catat.
 */
export function LinkPengaduanCard({ token }: { token: string }) {
    const [disalinLink, setDisalinLink] = useState(false);
    const [disalinToken, setDisalinToken] = useState(false);
    const [link, setLink] = useState('');

    useEffect(() => {
        setLink(`${window.location.origin}/pengaduan/lacak/${token}`);
    }, [token]);

    async function salinTeks(teks: string, tandai: (v: boolean) => void) {
        try {
            await navigator.clipboard.writeText(teks);
            tandai(true);
            setTimeout(() => tandai(false), 2000);
        } catch {
            // Clipboard API mungkin diblokir browser tertentu — teks tetap
            // bisa disalin manual karena ditampilkan sebagai teks biasa.
        }
    }

    return (
        <div className="mt-6 bg-paper-50 border border-paper-200 rounded-2xl p-5 text-left space-y-4">
            <div>
                <div className="text-xs text-navy-950/40 uppercase tracking-wide mb-2">Link Lacak Pengaduan Anda</div>
                <div className="bg-white border border-paper-200 rounded-xl px-3.5 py-2.5 text-xs text-navy-700 break-all font-mono mb-2">
                    {link || '...'}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <button
                        onClick={() => salinTeks(link, setDisalinLink)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-navy-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors"
                    >
                        {disalinLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {disalinLink ? 'Tersalin!' : 'Salin Link'}
                    </button>
                    <Link
                        href={`/pengaduan/lacak/${token}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white border border-paper-200 text-navy-950 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-paper-100 transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Buka Sekarang
                    </Link>
                </div>
            </div>

            <div className="pt-4 border-t border-paper-200">
                <div className="text-xs text-navy-950/40 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    Atau Kode Token Anda
                </div>
                <div className="bg-white border border-paper-200 rounded-xl px-3.5 py-2.5 text-xs text-navy-700 break-all font-mono mb-2">
                    {token}
                </div>
                <button
                    onClick={() => salinTeks(token, setDisalinToken)}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-white border border-paper-200 text-navy-950 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-paper-100 transition-colors"
                >
                    {disalinToken ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {disalinToken ? 'Tersalin!' : 'Salin Kode Token'}
                </button>
                <p className="text-xs text-navy-950/40 mt-2 leading-relaxed">
                    Kode token ini bisa dipakai untuk melacak pengaduan di halaman{' '}
                    <Link href="/pengaduan/cari" className="text-azure-500 hover:underline">Lacak Pengaduan</Link>,
                    kalau Anda lebih mudah mencatat kode singkat ini daripada link lengkap.
                </p>
            </div>
        </div>
    );
}
