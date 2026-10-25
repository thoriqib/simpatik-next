'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { simpanNomorWa } from '@/lib/actions/nomor-wa';

export interface BarisNomor { id: string; name: string; email: string; noHp: string }

export function NomorWaForm({ baris }: { baris: BarisNomor[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [nilai, setNilai] = useState<Record<string, string>>(() => Object.fromEntries(baris.map((b) => [b.id, b.noHp])));
    const [salah, setSalah] = useState<Set<string>>(new Set());
    const [pesan, setPesan] = useState<{ tipe: 'error' | 'success'; teks: string } | null>(null);

    function handleSimpan(e: React.FormEvent) {
        e.preventDefault();
        setPesan(null);
        startTransition(async () => {
            const res = await simpanNomorWa(baris.map((b) => ({ id: b.id, noHp: nilai[b.id] ?? '' })));
            if (res.error) {
                setSalah(new Set(res.salah ?? []));
                setPesan({ tipe: 'error', teks: res.error });
                return;
            }
            setSalah(new Set());
            setPesan({ tipe: 'success', teks: res.success ?? 'Tersimpan.' });
            router.refresh();
        });
    }

    const terisi = baris.filter((b) => (nilai[b.id] ?? '').trim()).length;

    return (
        <form onSubmit={handleSimpan}>
            {pesan && (
                <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${pesan.tipe === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                    {pesan.teks}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-paper-200 text-navy-950/50 text-left">
                            <th className="pb-3 font-medium">Nama</th>
                            <th className="pb-3 font-medium">Email</th>
                            <th className="pb-3 font-medium w-56">Nomor WhatsApp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-paper-100">
                        {baris.map((b) => (
                            <tr key={b.id}>
                                <td className="py-2.5 pr-3 font-medium text-navy-950">{b.name}</td>
                                <td className="py-2.5 pr-3 text-navy-950/60">{b.email}</td>
                                <td className="py-2.5">
                                    <input
                                        type="tel" inputMode="tel" disabled={isPending}
                                        value={nilai[b.id] ?? ''}
                                        onChange={(e) => setNilai((p) => ({ ...p, [b.id]: e.target.value }))}
                                        placeholder="0812 3456 7890"
                                        className={`w-full border rounded-xl px-3 py-2 text-sm disabled:opacity-60 ${salah.has(b.id) ? 'border-rose-300 bg-rose-50/50' : 'border-paper-200 bg-white'}`}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between gap-3 mt-5">
                <span className="text-xs text-navy-950/50">{terisi} dari {baris.length} petugas sudah punya nomor</span>
                <button type="submit" disabled={isPending}
                    className="inline-flex items-center gap-2 bg-navy-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-navy-800 transition-colors disabled:opacity-50">
                    {isPending ? <Spinner /> : <Save className="w-4 h-4" />}
                    {isPending ? 'Menyimpan...' : 'Simpan Semua'}
                </button>
            </div>
        </form>
    );
}
