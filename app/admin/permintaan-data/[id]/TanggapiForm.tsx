'use client';

import { useActionState } from 'react';
import { tanggapiPermintaanData } from '@/lib/actions/permintaan-data';
import { SubmitButton } from '@/components/ui/SubmitButton';

export function TanggapiForm({ id, currentStatus, basePath }: { id: number; currentStatus: string; basePath: string }) {
    const action = tanggapiPermintaanData.bind(null, id, basePath);
    const [state, formAction] = useActionState(action, null);

    return (
        <form action={formAction} className="space-y-4">
            {state?.error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm">{state.error}</div>}
            <div>
                <label className="block text-sm font-medium text-navy-950 mb-1.5">Tanggapan</label>
                <textarea name="tanggapan" rows={5} required maxLength={2000} placeholder="Tulis tanggapan/tindak lanjut untuk permintaan data ini..."
                    className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500 transition-colors" />
            </div>
            <div>
                <label className="block text-sm font-medium text-navy-950 mb-1.5">Update Status</label>
                <select name="status" defaultValue={currentStatus === 'diproses' ? 'diproses' : 'diproses'} className="border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm w-full bg-white">
                    <option value="diproses">Tandai: Sedang Diproses</option>
                    <option value="selesai">Tandai: Selesai (kirim tanggapan)</option>
                </select>
            </div>
            <SubmitButton>Kirim Tanggapan</SubmitButton>
        </form>
    );
}
