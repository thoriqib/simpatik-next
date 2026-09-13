'use client';

import { useActionState } from 'react';
import { kirimPengaduan } from '@/lib/actions/pengaduan';
import { SubmitButton } from '@/components/ui/SubmitButton';

export function PengaduanForm() {
    const [state, formAction] = useActionState(kirimPengaduan, null);

    return (
        <form action={formAction} className="space-y-4">
            {state?.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{state.error}</div>
            )}

            <div>
                <label className="block text-sm font-medium text-navy-950/80 mb-1">
                    Subjek Pengaduan <span className="text-red-500">*</span>
                </label>
                <input name="subjek" required placeholder="Contoh: Petugas kurang responsif"
                    className="w-full border border-paper-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-azure-500/40" />
            </div>

            <div>
                <label className="block text-sm font-medium text-navy-950/80 mb-1">
                    Isi Pengaduan <span className="text-red-500">*</span>
                </label>
                <textarea name="isi_pengaduan" rows={5} required placeholder="Jelaskan pengaduan Anda secara detail..."
                    className="w-full border border-paper-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-azure-500/40 resize-none" />
            </div>

            <SubmitButton className="w-full py-3" pendingText="Mengirim...">
                📢 Kirim Pengaduan
            </SubmitButton>
        </form>
    );
}
