'use client';

import { useState, useActionState } from 'react';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { createPetugasAccount, updatePetugasAccount, deletePetugasAccount } from '@/lib/actions/auth';

interface Petugas {
    id: string; name: string; email: string; antrian_count: number; avg_nilai: number | null;
}

export function PetugasTable({ petugas }: { petugas: Petugas[] }) {
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<Petugas | null>(null);
    const [deleting, setDeleting] = useState<Petugas | null>(null);
    const [deletePending, setDeletePending] = useState(false);

    const handleDelete = async () => {
        if (!deleting) return;
        setDeletePending(true);
        await deletePetugasAccount(deleting.id);
        setDeletePending(false);
        setDeleting(null);
    };

    return (
        <>
            <div className="flex justify-end mb-4">
                <button onClick={() => setShowCreate(true)} className="bg-[#003580] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition">
                    + Tambah Petugas
                </button>
            </div>

            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b text-gray-500 text-left">
                        <th className="pb-3 font-medium">Nama</th>
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium text-center">Total Layanan</th>
                        <th className="pb-3 font-medium text-center">Rata-rata Nilai</th>
                        <th className="pb-3 font-medium">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {petugas.length > 0 ? petugas.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                            <td className="py-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-[#003580] rounded-full flex items-center justify-center text-white text-xs font-bold">
                                        {p.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium">{p.name}</span>
                                </div>
                            </td>
                            <td className="py-3 text-gray-500">{p.email}</td>
                            <td className="py-3 text-center">{p.antrian_count}</td>
                            <td className="py-3 text-center">
                                {p.avg_nilai ? <span className="text-yellow-500 font-semibold">★ {p.avg_nilai.toFixed(1)}</span> : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="py-3">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setEditing(p)} className="text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">✏️ Edit</button>
                                    <button onClick={() => setDeleting(p)} className="text-xs font-medium bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">🗑️ Hapus</button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan={5} className="py-10 text-center text-gray-400">Belum ada petugas terdaftar</td></tr>
                    )}
                </tbody>
            </table>

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Tambah Petugas Baru">
                <CreateForm onSuccess={() => setShowCreate(false)} />
            </Modal>

            <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Petugas">
                {editing && <EditForm petugas={editing} onSuccess={() => setEditing(null)} />}
            </Modal>

            <ConfirmModal
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={handleDelete}
                pending={deletePending}
                title="Hapus Petugas"
                message={`Yakin ingin menghapus petugas ${deleting?.name}? Data jadwal dan presensi terkait akan ikut terhapus.`}
            />
        </>
    );
}

function CreateForm({ onSuccess }: { onSuccess: () => void }) {
    const [state, formAction] = useActionState(createPetugasAccount, null);
    return (
        <form action={formAction} className="space-y-4">
            {state?.error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{state.error}</div>}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input name="name" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input name="email" type="email" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input name="password" type="password" required minLength={8} placeholder="Min. 8 karakter" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <SubmitButton className="w-full">Simpan Petugas</SubmitButton>
        </form>
    );
}

function EditForm({ petugas, onSuccess }: { petugas: Petugas; onSuccess: () => void }) {
    const updateWithId = updatePetugasAccount.bind(null, petugas.id);
    const [state, formAction] = useActionState(updateWithId, null);
    return (
        <form action={formAction} className="space-y-4">
            {state?.error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{state.error}</div>}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input name="name" defaultValue={petugas.name} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input name="email" type="email" defaultValue={petugas.email} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru <span className="text-gray-400 font-normal">(kosongkan jika tidak diubah)</span></label>
                <input name="password" type="password" minLength={8} placeholder="Min. 8 karakter" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <SubmitButton className="w-full">Simpan Perubahan</SubmitButton>
        </form>
    );
}
