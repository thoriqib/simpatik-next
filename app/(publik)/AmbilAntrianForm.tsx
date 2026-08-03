'use client';

import { useActionState } from 'react';
import { ambilAntrian } from '@/lib/actions/antrian';
import { SubmitButton } from '@/components/ui/SubmitButton';
import type { JenisLayanan } from '@/lib/types/database';

export function AmbilAntrianForm({ jenisLayanan }: { jenisLayanan: JenisLayanan[] }) {
    const [state, formAction] = useActionState(ambilAntrian, null);

    return (
        <form action={formAction} className="space-y-4">
            {state?.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{state.error}</div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jenis Layanan <span className="text-red-500">*</span>
                </label>
                <select name="jenis_layanan_id" required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                    <option value="">Pilih jenis layanan...</option>
                    {jenisLayanan.map((j) => (
                        <option key={j.id} value={j.id}>[{j.kode}] {j.nama_layanan}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input name="nama_pengunjung" required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. HP</label>
                <input name="no_hp" type="tel"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input name="email" type="email"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>

            <SubmitButton className="w-full py-3 text-base" pendingText="Memproses...">
                🎫 Ambil Nomor Antrian
            </SubmitButton>
        </form>
    );
}
