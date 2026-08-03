'use client';

import { useActionState } from 'react';
import { ambilAntrian } from '@/lib/actions/antrian';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Ticket } from 'lucide-react';
import type { JenisLayanan } from '@/lib/types/database';

export function AmbilAntrianForm({ jenisLayanan }: { jenisLayanan: JenisLayanan[] }) {
    const [state, formAction] = useActionState(ambilAntrian, null);

    return (
        <form action={formAction} className="space-y-4">
            {state?.error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">{state.error}</div>
            )}

            <div>
                <label className="block text-sm font-medium text-navy-950 mb-1.5">
                    Jenis Layanan <span className="text-rose-500">*</span>
                </label>
                <select name="jenis_layanan_id" required
                    className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500 transition-colors">
                    <option value="">Pilih jenis layanan...</option>
                    {jenisLayanan.map((j) => (
                        <option key={j.id} value={j.id}>[{j.kode}] {j.nama_layanan}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-navy-950 mb-1.5">
                    Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input name="nama_pengunjung" required
                    className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500 transition-colors" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-navy-950 mb-1.5">No. HP</label>
                    <input name="no_hp" type="tel"
                        className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500 transition-colors" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-navy-950 mb-1.5">Email</label>
                    <input name="email" type="email"
                        className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500 transition-colors" />
                </div>
            </div>

            <SubmitButton className="w-full py-3.5 text-base mt-2" pendingText="Memproses...">
                <Ticket className="w-4 h-4" />
                Ambil Nomor Antrian
            </SubmitButton>
        </form>
    );
}
