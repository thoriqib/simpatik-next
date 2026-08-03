'use client';

import { useTransition } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { panggilAntrian, mulaiLayaniAntrian, selesaiAntrian, batalAntrian } from '@/lib/actions/antrian';
import type { Antrian } from '@/lib/types/database';

export function AntrianPanel({ antrianAktif, petugasId }: { antrianAktif: Antrian[]; petugasId: string }) {
    const [isPending, startTransition] = useTransition();

    return (
        <Card title="Antrian Menunggu Hari Ini">
            {antrianAktif.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-gray-500 text-left">
                                <th className="pb-3 font-medium">Kode</th><th className="pb-3 font-medium">Nama</th>
                                <th className="pb-3 font-medium">Layanan</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {antrianAktif.map((item) => (
                                <tr key={item.id} className={`hover:bg-gray-50 ${item.status === 'dipanggil' ? 'bg-blue-50' : ''} ${item.status === 'dilayani' ? 'bg-purple-50' : ''}`}>
                                    <td className="py-3 font-mono font-bold text-[#003580] text-base">{item.kode_antrian}</td>
                                    <td className="py-3">
                                        <div className="font-medium">{item.nama_pengunjung}</div>
                                        {item.no_hp && <div className="text-xs text-gray-400">{item.no_hp}</div>}
                                    </td>
                                    <td className="py-3 text-gray-600 text-xs">{item.jenis_layanan?.nama_layanan}</td>
                                    <td className="py-3"><Badge status={item.status} /></td>
                                    <td className="py-3">
                                        <div className="flex gap-2">
                                            {item.status === 'menunggu' && (
                                                <button disabled={isPending} onClick={() => startTransition(() => panggilAntrian(item.id, petugasId))}
                                                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition disabled:opacity-50">📣 Panggil</button>
                                            )}
                                            {item.status === 'dipanggil' && (
                                                <button disabled={isPending} onClick={() => startTransition(() => mulaiLayaniAntrian(item.id))}
                                                    className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-700 transition disabled:opacity-50">▶ Mulai Layani</button>
                                            )}
                                            {item.status === 'dilayani' && (
                                                <>
                                                    <button disabled={isPending} onClick={() => startTransition(() => selesaiAntrian(item.id))}
                                                        className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 transition disabled:opacity-50">✔ Selesai</button>
                                                    <button disabled={isPending} onClick={() => startTransition(() => batalAntrian(item.id))}
                                                        className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200 transition disabled:opacity-50">Batal</button>
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
                <div className="py-10 text-center text-gray-400"><p className="text-sm">Tidak ada antrian aktif saat ini.</p></div>
            )}
        </Card>
    );
}
