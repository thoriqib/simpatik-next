'use client';

import { useActionState, useState } from 'react';
import { kirimPenilaian } from '@/lib/actions/penilaian';
import { SubmitButton } from '@/components/ui/SubmitButton';

export function PenilaianForm({ antrianId, petugasId }: { antrianId: number; petugasId: string }) {
    const [state, formAction] = useActionState(kirimPenilaian, null);
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);

    const labelNilai: Record<number, string> = {
        1: '😞 Sangat Tidak Puas', 2: '😕 Tidak Puas', 3: '😐 Cukup', 4: '😊 Puas', 5: '😄 Sangat Puas',
    };

    return (
        <form action={formAction}>
            <input type="hidden" name="antrian_id" value={antrianId} />
            <input type="hidden" name="petugas_id" value={petugasId} />
            <input type="hidden" name="nilai" value={rating} />

            {state?.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">{state.error}</div>
            )}

            <div className="text-center mb-6">
                <p className="text-sm font-medium text-navy-950/80 mb-3">Seberapa puas Anda dengan pelayanan kami?</p>
                <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <button key={i} type="button"
                            onClick={() => setRating(i)}
                            onMouseEnter={() => setHover(i)}
                            onMouseLeave={() => setHover(0)}
                            className={`text-5xl transition-all transform cursor-pointer ${(hover || rating) >= i ? 'text-yellow-400 scale-110' : 'text-navy-950/20'}`}>
                            ★
                        </button>
                    ))}
                </div>
                <p className="text-sm text-navy-950/50 mt-2 h-5">{labelNilai[rating] ?? ''}</p>
            </div>

            <div className="mb-5">
                <label className="block text-sm font-medium text-navy-950/80 mb-1">
                    Komentar <span className="text-navy-950/30">(opsional)</span>
                </label>
                <textarea name="komentar" rows={4} placeholder="Ceritakan pengalaman Anda..."
                    className="w-full border border-paper-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-azure-500/40 resize-none" />
            </div>

            <SubmitButton className="w-full py-3" pendingText="Mengirim...">
                Kirim Penilaian
            </SubmitButton>
        </form>
    );
}
