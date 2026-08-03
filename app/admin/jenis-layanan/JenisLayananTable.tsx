'use client';

import { useState, useActionState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { saveJenisLayanan, deleteJenisLayanan } from '@/lib/actions/jenis-layanan';
import type { JenisLayanan } from '@/lib/types/database';

interface Item extends JenisLayanan { total_antrian: number }

export function JenisLayananTable({ jenisLayanan }: { jenisLayanan: Item[] }) {
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<Item | null>(null);

    return (
        <>
            <div className="flex justify-end mb-4">
                <button onClick={() => setShowCreate(true)} className="bg-navy-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-navy-800 transition">
                    + Tambah Jenis Layanan
                </button>
            </div>
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b text-navy-950/50 text-left">
                        <th className="pb-3 font-medium">Kode</th><th className="pb-3 font-medium">Nama Layanan</th>
                        <th className="pb-3 font-medium">Total Antrian</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {jenisLayanan.length > 0 ? jenisLayanan.map((j) => (
                        <tr key={j.id} className="hover:bg-paper-50">
                            <td className="py-3"><span className="font-mono font-bold text-navy-700 bg-azure-500/10 px-2 py-1 rounded">{j.kode}</span></td>
                            <td className="py-3">
                                <div className="font-medium">{j.nama_layanan}</div>
                                {j.deskripsi && <div className="text-xs text-navy-950/30 mt-0.5">{j.deskripsi.slice(0, 60)}</div>}
                            </td>
                            <td className="py-3 text-center text-navy-950/50">{j.total_antrian}</td>
                            <td className="py-3">
                                {j.is_aktif
                                    ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Aktif</span>
                                    : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-paper-100 text-navy-950/50">Nonaktif</span>}
                            </td>
                            <td className="py-3 flex gap-3">
                                <button onClick={() => setEditing(j)} className="text-azure-500 hover:underline">Edit</button>
                                <form action={async () => { const r = await deleteJenisLayanan(j.id); if (r?.error) alert(r.error); }}>
                                    <button type="submit" className="text-red-500 hover:underline">Hapus</button>
                                </form>
                            </td>
                        </tr>
                    )) : <tr><td colSpan={5} className="py-8 text-center text-navy-950/30">Belum ada jenis layanan</td></tr>}
                </tbody>
            </table>

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Tambah Jenis Layanan">
                <JenisLayananForm id={null} onSuccess={() => setShowCreate(false)} />
            </Modal>
            <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Jenis Layanan">
                {editing && <JenisLayananForm id={editing.id} item={editing} onSuccess={() => setEditing(null)} />}
            </Modal>
        </>
    );
}

function JenisLayananForm({ id, item, onSuccess }: { id: number | null; item?: Item; onSuccess: () => void }) {
    const action = saveJenisLayanan.bind(null, id);
    const [state, formAction] = useActionState(action, null);

    return (
        <form action={formAction} className="space-y-4">
            {state?.error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">{state.error}</div>}
            <div>
                <label className="block text-sm font-medium text-navy-950/80 mb-1">Kode Layanan</label>
                <input name="kode" defaultValue={item?.kode} maxLength={5} required style={{ textTransform: 'uppercase' }}
                    className="w-full border border-paper-200 rounded-xl px-3 py-2 text-sm uppercase font-mono font-bold tracking-widest" />
            </div>
            <div>
                <label className="block text-sm font-medium text-navy-950/80 mb-1">Nama Layanan</label>
                <input name="nama_layanan" defaultValue={item?.nama_layanan} required className="w-full border border-paper-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-navy-950/80 mb-1">Deskripsi <span className="text-navy-950/30 font-normal">(opsional)</span></label>
                <textarea name="deskripsi" defaultValue={item?.deskripsi ?? ''} rows={3} className="w-full border border-paper-200 rounded-xl px-3 py-2 text-sm resize-none" />
            </div>
            <div className="flex items-center gap-2">
                <input type="checkbox" name="is_aktif" id="is_aktif" defaultChecked={item?.is_aktif ?? true} className="w-4 h-4 rounded border-paper-200 text-navy-700" />
                <label htmlFor="is_aktif" className="text-sm text-navy-950/80">Layanan ini aktif</label>
            </div>
            <SubmitButton className="w-full">Simpan Layanan</SubmitButton>
        </form>
    );
}
