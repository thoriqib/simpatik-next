'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ambilPengaduanPublik } from '@/lib/actions/pengaduan';
import { KeyRound, ArrowRight } from 'lucide-react';

/** Pola UUID standar — dipakai untuk validasi format sebelum submit. */
const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/**
 * Ekstrak token dari input pengguna — bisa berupa link lengkap
 * (`.../pengaduan/lacak/{token}`) atau token mentah saja. Pengaduan
 * TIDAK PUNYA email/identitas apa pun untuk dicari ulang (beda dengan
 * permintaan data) — token/link inilah satu-satunya jalan pulih.
 */
function ekstrakToken(input: string): string | null {
    const cocok = input.trim().match(UUID_REGEX);
    return cocok ? cocok[0] : null;
}

export function CariPengaduanForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [input, setInput] = useState('');
    const [error, setError] = useState('');

    function handleCari(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        const token = ekstrakToken(input);
        if (!token) {
            setError('Format link/token tidak dikenali. Pastikan disalin utuh dari layar konfirmasi setelah mengirim pengaduan.');
            return;
        }

        startTransition(async () => {
            const data = await ambilPengaduanPublik(token);
            if (!data) {
                setError('Pengaduan tidak ditemukan. Periksa kembali link/token yang Anda masukkan.');
                return;
            }
            router.push(`/pengaduan/lacak/${token}`);
        });
    }

    return (
        <form onSubmit={handleCari} className="bg-white rounded-2xl shadow-soft border border-paper-200 p-6 space-y-4">
            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm">{error}</div>}

            <div>
                <label className="block text-sm font-medium text-navy-950/80 mb-1">
                    Link atau kode token pengaduan Anda
                </label>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Tempel link lengkap, atau kode acak setelah /lacak/"
                    required
                    className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500"
                />
                <p className="text-xs text-navy-950/40 mt-1.5">
                    Pengaduan bersifat anonim — tidak ada email/nama yang tersimpan, jadi
                    link atau kode token ini satu-satunya cara mengakses kembali percakapan Anda.
                </p>
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="w-full inline-flex items-center justify-center gap-2 bg-navy-700 text-white py-3 rounded-xl text-sm font-semibold hover:bg-navy-800 transition-colors disabled:opacity-50"
            >
                <KeyRound className="w-4 h-4" />
                {isPending ? 'Memeriksa...' : 'Lacak Pengaduan'}
                {!isPending && <ArrowRight className="w-4 h-4" />}
            </button>
        </form>
    );
}
