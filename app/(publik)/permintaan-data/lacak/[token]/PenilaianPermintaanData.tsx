'use client';

import { useState, useTransition } from 'react';
import { kirimPenilaianPermintaanDataPublik } from '@/lib/actions/permintaan-data';
import { CheckCircle2 } from 'lucide-react';

const LABEL_NILAI: Record<number, string> = {
    1: '😞 Sangat Tidak Puas', 2: '😕 Tidak Puas', 3: '😐 Cukup', 4: '😊 Puas', 5: '😄 Sangat Puas',
};

export function PenilaianPermintaanData({
    token,
    sudahDinilai,
    nilaiDiberikan,
    komentarDiberikan,
}: {
    token: string;
    sudahDinilai: boolean;
    nilaiDiberikan: number | null;
    komentarDiberikan: string | null;
}) {
    const [isPending, startTransition] = useTransition();
    const [terkirim, setTerkirim] = useState(sudahDinilai);
    const [nilaiFinal, setNilaiFinal] = useState(nilaiDiberikan ?? 0);
    const [nilai, setNilai] = useState(0);
    const [hover, setHover] = useState(0);
    const [komentar, setKomentar] = useState('');
    const [error, setError] = useState('');

    function handleKirim(e: React.FormEvent) {
        e.preventDefault();
        if (!nilai) {
            setError('Silakan pilih bintang penilaian terlebih dahulu.');
            return;
        }
        setError('');
        startTransition(async () => {
            const res = await kirimPenilaianPermintaanDataPublik(token, nilai, komentar);
            if (res?.error) {
                setError(res.error);
                return;
            }
            setNilaiFinal(nilai);
            setTerkirim(true);
        });
    }

    if (terkirim) {
        return (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-emerald-700 mb-1">Terima kasih atas penilaian Anda!</p>
                <div className="text-2xl mb-1">
                    {'★'.repeat(nilaiFinal)}{'☆'.repeat(5 - nilaiFinal)}
                </div>
                {komentarDiberikan && <p className="text-sm text-navy-950/50 italic mt-2">&ldquo;{komentarDiberikan}&rdquo;</p>}
            </div>
        );
    }

    return (
        <form onSubmit={handleKirim} className="bg-paper-50 rounded-xl p-5">
            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm mb-4">{error}</div>}
            <div className="text-center mb-5">
                <p className="text-sm font-medium text-navy-950/80 mb-3">Seberapa puas Anda dengan layanan ini?</p>
                <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setNilai(i)}
                            onMouseEnter={() => setHover(i)}
                            onMouseLeave={() => setHover(0)}
                            className={`text-4xl transition-all transform cursor-pointer ${(hover || nilai) >= i ? 'text-yellow-400 scale-110' : 'text-navy-950/20'}`}
                        >
                            ★
                        </button>
                    ))}
                </div>
                <p className="text-sm text-navy-950/50 mt-2 h-5">{LABEL_NILAI[hover || nilai] ?? ''}</p>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-navy-950/80 mb-1">
                    Komentar <span className="text-navy-950/30">(opsional)</span>
                </label>
                <textarea
                    value={komentar}
                    onChange={(e) => setKomentar(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="Ceritakan pengalaman Anda..."
                    className="w-full border border-paper-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-azure-500/40 resize-none bg-white"
                />
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="w-full bg-navy-700 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-navy-800 transition-colors disabled:opacity-50"
            >
                {isPending ? 'Mengirim...' : 'Kirim Penilaian'}
            </button>
        </form>
    );
}
