'use client';

import { useActionState } from 'react';
import { tanggapiPengaduan } from '@/lib/actions/pengaduan';
import { SubmitButton } from '@/components/ui/SubmitButton';

export function TanggapiForm({ id, currentStatus }: { id: number; currentStatus: string }) {
    const action = tanggapiPengaduan.bind(null, id);
    const [state, formAction] = useActionState(action, null);

    return (
        <form action={formAction} className="space-y-4">
            {state?.error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{state.error}</div>}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggapan</label>
                <textarea name="tanggapan" rows={5} required placeholder="Tulis tanggapan resmi untuk pengaduan ini..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
                <select name="status" defaultValue={currentStatus === 'diproses' ? 'diproses' : 'diproses'} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full">
                    <option value="diproses">Tandai: Sedang Diproses</option>
                    <option value="selesai">Tandai: Selesai (kirim tanggapan)</option>
                </select>
            </div>
            <SubmitButton>Kirim Tanggapan</SubmitButton>
        </form>
    );
}
