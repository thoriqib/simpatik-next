'use client';

import { useState, useTransition } from 'react';
import { ubahRolePengguna } from '@/lib/actions/auth';
import { ConfirmModal } from '@/components/ui/Modal';
import { ShieldCheck, ShieldOff } from 'lucide-react';

interface Staf {
    id: string;
    name: string;
    email: string;
    role: string;
}

export function RoleTable({ staf, currentUserId }: { staf: Staf[]; currentUserId: string }) {
    const [isPending, startTransition] = useTransition();
    const [target, setTarget] = useState<Staf | null>(null);
    const [error, setError] = useState('');

    function handleKonfirmasi() {
        if (!target) return;
        const roleBaru = target.role === 'admin' ? 'petugas' : 'admin';
        startTransition(async () => {
            const res = await ubahRolePengguna(target.id, roleBaru);
            setTarget(null);
            if (res?.error) {
                setError(res.error);
                return;
            }
            window.location.reload(); // jamin daftar & role terbaru termuat
        });
    }

    return (
        <>
            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm mb-4">{error}</div>}
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b text-navy-950/50 text-left">
                        <th className="pb-3 font-medium">Nama</th>
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Role</th>
                        <th className="pb-3 font-medium">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {staf.map((s) => {
                        const iniSayaSendiri = s.id === currentUserId;
                        return (
                            <tr key={s.id} className="hover:bg-paper-50">
                                <td className="py-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-navy-950">{s.name}</span>
                                        {iniSayaSendiri && <span className="text-[10px] bg-azure-500/10 text-azure-500 px-1.5 py-0.5 rounded-full font-medium">Saya</span>}
                                    </div>
                                </td>
                                <td className="py-3 text-navy-950/60">{s.email}</td>
                                <td className="py-3">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${s.role === 'admin' ? 'bg-navy-700/10 text-navy-700' : 'bg-paper-100 text-navy-950/60'}`}>
                                        {s.role === 'admin' ? 'Admin' : 'Petugas'}
                                    </span>
                                </td>
                                <td className="py-3">
                                    <button
                                        onClick={() => setTarget(s)}
                                        disabled={isPending || iniSayaSendiri}
                                        title={iniSayaSendiri ? 'Tidak bisa mengubah role akun sendiri' : undefined}
                                        className="inline-flex items-center gap-1.5 text-xs font-medium bg-paper-100 text-navy-950 px-3 py-1.5 rounded-lg hover:bg-paper-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {s.role === 'admin' ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                        {s.role === 'admin' ? 'Jadikan Petugas' : 'Jadikan Admin'}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <ConfirmModal
                open={!!target}
                onClose={() => setTarget(null)}
                onConfirm={handleKonfirmasi}
                pending={isPending}
                title={target?.role === 'admin' ? 'Turunkan jadi Petugas?' : 'Jadikan Admin?'}
                message={
                    target?.role === 'admin'
                        ? `${target?.name} akan kehilangan akses admin dan hanya bisa mengakses fitur petugas.`
                        : `${target?.name} akan mendapat akses penuh sebagai admin, termasuk kelola petugas, jenis layanan, dan seluruh laporan.`
                }
                confirmText={target?.role === 'admin' ? 'Ya, Turunkan' : 'Ya, Jadikan Admin'}
                pendingText="Memproses..."
                variant={target?.role === 'admin' ? 'danger' : 'primary'}
            />
        </>
    );
}
