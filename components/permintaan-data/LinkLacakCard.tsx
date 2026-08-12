'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, ExternalLink, Link2 } from 'lucide-react';

/**
 * Menampilkan link halaman lacak/chat (yang dilihat pengunjung) untuk
 * staf — supaya admin/petugas bisa buka langsung untuk verifikasi
 * tampilan, atau salin linknya kalau perlu dikirim ulang ke pengunjung
 * (misal pengunjung bilang link di email hilang).
 */
export function LinkLacakCard({ token }: { token: string }) {
    const [link, setLink] = useState('');
    const [disalin, setDisalin] = useState(false);

    useEffect(() => {
        setLink(`${window.location.origin}/permintaan-data/lacak/${token}`);
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
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-navy-950/40 shrink-0">
                <Link2 className="w-3.5 h-3.5" />
                Link tanya jawab pengunjung:
            </div>
            <code className="flex-1 min-w-0 bg-paper-50 border border-paper-200 rounded-lg px-2.5 py-1.5 text-xs text-navy-700 truncate">
                {link || '...'}
            </code>
            <button
                onClick={handleSalin}
                className="inline-flex items-center gap-1 text-xs font-medium bg-paper-100 text-navy-950 px-2.5 py-1.5 rounded-lg hover:bg-paper-200 transition-colors shrink-0"
            >
                {disalin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {disalin ? 'Tersalin' : 'Salin'}
            </button>
            <a
                href={`/permintaan-data/lacak/${token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium bg-azure-500/10 text-azure-500 px-2.5 py-1.5 rounded-lg hover:bg-azure-500/20 transition-colors shrink-0"
            >
                <ExternalLink className="w-3.5 h-3.5" />
                Buka
            </a>
        </div>
    );
}
