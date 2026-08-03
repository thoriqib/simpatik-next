'use client';

import { useActionState } from 'react';
import { tambahJadwal } from '@/lib/actions/jadwal';
import { SubmitButton } from '@/components/ui/SubmitButton';

export function JadwalForm({ petugas, shifts }: { petugas: { id: string; name: string }[]; shifts: { id: number; nama_shift: string; jam_mulai: string }[] }) {
    const [state, formAction] = useActionState(tambahJadwal, null);

    return (
        <form action={formAction} className="flex flex-wrap gap-4 items-end">
            {state?.error && <div className="w-full bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">{state.error}</div>}
            <div className="flex-1 min-w-40">
                <label className="block text-sm font-medium text-navy-950/80 mb-1">Petugas</label>
                <select name="user_id" required className="w-full border border-paper-200 rounded-xl px-3 py-2 text-sm">
                    <option value="">Pilih petugas...</option>
                    {petugas.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
            <div className="flex-1 min-w-36">
                <label className="block text-sm font-medium text-navy-950/80 mb-1">Shift</label>
                <select name="shift_id" required className="w-full border border-paper-200 rounded-xl px-3 py-2 text-sm">
                    <option value="">Pilih shift...</option>
                    {shifts.map((s) => <option key={s.id} value={s.id}>{s.nama_shift} ({s.jam_mulai})</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-navy-950/80 mb-1">Tanggal</label>
                <input type="date" name="tanggal" min={new Date().toISOString().slice(0, 10)} required className="border border-paper-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <SubmitButton>Tambah</SubmitButton>
        </form>
    );
}
