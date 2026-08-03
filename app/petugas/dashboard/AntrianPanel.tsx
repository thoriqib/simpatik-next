'use client';

import { useTransition } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { panggilAntrian, mulaiLayaniAntrian, selesaiAntrian, batalAntrian } from '@/lib/actions/antrian';
import { Megaphone, Play, Check, X } from 'lucide-react';
import type { Antrian } from '@/lib/types/database';

export function AntrianPanel({ antrianAktif, petugasId }: { antrianAktif: Antrian[]; petugasId: string }) {
    const [isPending, startTransition] = useTransition();

    return (
        <Card title="Antrian Menunggu Hari Ini">
            {antrianAktif.length > 0 ? (
                <div className="overflow-x-auto -mx-6 px-6">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-paper-200 text-navy-950/40 text-left text-xs uppercase tracking-wide">
                                <th className="pb-3 font-medium">Kode</th><th className="pb-3 font-medium">Nama</th>
                                <th className="pb-3 font-medium">Layanan</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-paper-100">
                            {antrianAktif.map((item) => (
                                <tr key={item.id} className={`transition-colors ${item.status === 'dipanggil' ? 'bg-azure-500/5' : item.status === 'dilayani' ? 'bg-amber-500/5' : 'hover:bg-paper-50'}`}>
                                    <td className="py-3 font-mono font-semibold text-navy-700 text-base tabular">{item.kode_antrian}</td>
                                    <td className="py-3">
                                        <div className="font-medium text-navy-950">{item.nama_pengunjung}</div>
                                        {item.no_hp && <div className="text-xs text-navy-950/40">{item.no_hp}</div>}
                                    </td>
                                    <td className="py-3 text-navy-950/60 text-xs">{item.jenis_layanan?.nama_layanan}</td>
                                    <td className="py-3"><Badge status={item.status} /></td>
                                    <td className="py-3">
                                        <div className="flex gap-2">
                                            {item.status === 'menunggu' && (
                                                <button disabled={isPending} onClick={() => startTransition(() => panggilAntrian(item.id, petugasId))}
                                                    className="inline-flex items-center gap-1.5 bg-azure-500 text-white px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-azure-500/90 transition-colors disabled:opacity-50">
                                                    <Megaphone className="w-3.5 h-3.5" /> Panggil
                                                </button>
                                            )}
                                            {item.status === 'dipanggil' && (
                                                <button disabled={isPending} onClick={() => startTransition(() => mulaiLayaniAntrian(item.id))}
                                                    className="inline-flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-amber-500/90 transition-colors disabled:opacity-50">
                                                    <Play className="w-3.5 h-3.5" /> Mulai Layani
                                                </button>
                                            )}
                                            {item.status === 'dilayani' && (
                                                <>
                                                    <button disabled={isPending} onClick={() => startTransition(() => selesaiAntrian(item.id))}
                                                        className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
                                                        <Check className="w-3.5 h-3.5" /> Selesai
                                                    </button>
                                                    <button disabled={isPending} onClick={() => startTransition(() => batalAntrian(item.id))}
                                                        className="inline-flex items-center gap-1.5 bg-paper-100 text-navy-950/60 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-paper-200 transition-colors disabled:opacity-50">
                                                        <X className="w-3.5 h-3.5" /> Batal
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="py-10 text-center text-navy-950/30"><p className="text-sm">Tidak ada antrian aktif saat ini.</p></div>
            )}
        </Card>
    );
}
