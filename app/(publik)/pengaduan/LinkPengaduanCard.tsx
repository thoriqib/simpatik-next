'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Copy, Check, ExternalLink } from 'lucide-react';

export function LinkPengaduanCard({ token }: { token: string }) {
    const [disalin, setDisalin] = useState(false);
    const [link, setLink] = useState('');

    useEffect(() => {
        setLink(`${window.location.origin}/pengaduan/lacak/${token}`);
    }, [token]);

    async function handleSalin() {
        if (!link) return;
        try {
            await navigator.clipboard.writeText(link);
            setDisalin(true);
            setTimeout(() => setDisalin(false), 2000);
        } catch {
            // Clipboard API mungkin diblokir browser tertentu — link tetap
            // bisa disalin manual karena ditampilkan sebagai teks biasa.
        }
    }

    return (
        <div className="mt-6 bg-paper-50 border border-paper-200 rounded-2xl p-5 text-left">
            <div className="text-xs text-navy-950/40 uppercase tracking-wide mb-2">Link Lacak Pengaduan Anda</div>
            <div className="bg-white border border-paper-200 rounded-xl px-3.5 py-2.5 text-xs text-navy-700 break-all font-mono mb-3">
                {link || '...'}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <button
                    onClick={handleSalin}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-navy-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors"
                >
                    {disalin ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {disalin ? 'Tersalin!' : 'Salin Link'}
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
    );
}
