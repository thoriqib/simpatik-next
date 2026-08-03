'use client';

import { useState, useActionState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { saveShift, toggleShift, deleteShift } from '@/lib/actions/shift';
import type { ShiftPiket } from '@/lib/types/database';

export function ShiftTable({ shifts }: { shifts: ShiftPiket[] }) {
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<ShiftPiket | null>(null);

    return (
        <>
            <div className="flex justify-end mb-4">
                <button onClick={() => setShowCreate(true)} className="bg-navy-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-navy-800 transition">
                    + Tambah Shift
                </button>
            </div>

            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b text-navy-950/50 text-left">
                        <th className="pb-3 font-medium">Nama Shift</th><th className="pb-3 font-medium">Jam Mulai</th>
                        <th className="pb-3 font-medium">Jam Selesai</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {shifts.length > 0 ? shifts.map((s) => (
                        <tr key={s.id} className="hover:bg-paper-50">
                            <td className="py-3 font-medium">{s.nama_shift}</td>
                            <td className="py-3 font-mono">{s.jam_mulai}</td>
                            <td className="py-3 font-mono">{s.jam_selesai}</td>
                            <td className="py-3">
                                {s.is_aktif
                                    ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Aktif</span>
                                    : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-paper-100 text-navy-950/50">Nonaktif</span>}
                            </td>
                            <td className="py-3 flex gap-3">
                                <button onClick={() => setEditing(s)} className="text-azure-500 hover:underline text-sm">Edit</button>
                                <button onClick={() => toggleShift(s.id, s.is_aktif)} className="text-yellow-600 hover:underline text-sm">{s.is_aktif ? 'Nonaktifkan' : 'Aktifkan'}</button>
                                <form action={async () => { const r = await deleteShift(s.id); if (r?.error) alert(r.error); }}>
                                    <button type="submit" className="text-red-500 hover:underline text-sm">Hapus</button>
                                </form>
                            </td>
                        </tr>
                    )) : <tr><td colSpan={5} className="py-8 text-center text-navy-950/30">Belum ada shift terdaftar</td></tr>}
                </tbody>
            </table>

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Tambah Shift Piket">
                <ShiftForm id={null} onSuccess={() => setShowCreate(false)} />
            </Modal>
            <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Shift Piket">
                {editing && <ShiftForm id={editing.id} shift={editing} onSuccess={() => setEditing(null)} />}
            </Modal>
        </>
    );
}

function ShiftForm({ id, shift, onSuccess }: { id: number | null; shift?: ShiftPiket; onSuccess: () => void }) {
    const action = saveShift.bind(null, id);
    const [state, formAction] = useActionState(action, null);

    return (
        <form action={formAction} className="space-y-4">
            {state?.error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">{state.error}</div>}
            <div>
                <label className="block text-sm font-medium text-navy-950/80 mb-1">Nama Shift</label>
                <input name="nama_shift" defaultValue={shift?.nama_shift} required placeholder="Contoh: Pagi, Siang, Sore" className="w-full border border-paper-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-navy-950/80 mb-1">Jam Mulai</label>
                    <input type="time" name="jam_mulai" defaultValue={shift?.jam_mulai} required className="w-full border border-paper-200 rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-navy-950/80 mb-1">Jam Selesai</label>
                    <input type="time" name="jam_selesai" defaultValue={shift?.jam_selesai} required className="w-full border border-paper-200 rounded-xl px-3 py-2 text-sm" />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <input type="checkbox" name="is_aktif" id="is_aktif" defaultChecked={shift?.is_aktif ?? true} className="w-4 h-4 rounded border-paper-200 text-navy-700" />
                <label htmlFor="is_aktif" className="text-sm text-navy-950/80">Aktifkan shift ini</label>
            </div>
            <SubmitButton className="w-full">Simpan Shift</SubmitButton>
        </form>
    );
}
