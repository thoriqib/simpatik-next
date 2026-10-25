'use client';

import { useState, useTransition } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { panggilAntrian, mulaiLayaniAntrian, selesaiAntrian, batalAntrian } from '@/lib/actions/antrian';
import { QrTiketButton } from '@/components/QrTiketButton';
import { Megaphone, Play, Check, X, Repeat } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import type { Antrian } from '@/lib/types/database';

export function AntrianPanel({ antrianAktif, petugasId }: { antrianAktif: Antrian[]; petugasId: string }) {
    const [isPending, startTransition] = useTransition();
    // Tombol mana yang sedang diproses — supaya spinner muncul di tombol yang diklik
    const [aktif, setAktif] = useState<string | null>(null);

    function jalankan(kunci: string, aksi: () => Promise<unknown>) {
        setAktif(kunci);
        startTransition(async () => { await aksi(); });
    }
    const memproses = (kunci: string) => isPending && aktif === kunci;

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
                                        <div className="flex gap-2 flex-wrap">
                                            <QrTiketButton kodeAntrian={item.kode_antrian} namaPengunjung={item.nama_pengunjung} />
                                            {item.status === 'menunggu' && (
                                                <button disabled={isPending} onClick={() => jalankan(`panggil-${item.id}`, () => panggilAntrian(item.id, petugasId))}
                                                    className="inline-flex items-center gap-1.5 bg-azure-500 text-white px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-azure-500/90 transition-colors disabled:opacity-50">
                                                    {memproses(`panggil-${item.id}`) ? <Spinner className="w-3.5 h-3.5" /> : <Megaphone className="w-3.5 h-3.5" />} {memproses(`panggil-${item.id}`) ? 'Memanggil...' : 'Panggil'}
                                                </button>
                                            )}
                                            {item.status === 'dipanggil' && (
                                                <>
                                                    <button disabled={isPending} onClick={() => jalankan(`ulang-${item.id}`, () => panggilAntrian(item.id, petugasId))}
                                                        className="inline-flex items-center gap-1.5 bg-azure-500/10 text-azure-500 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-azure-500/20 transition-colors disabled:opacity-50"
                                                        title="Panggil ulang — mengulang pengumuman suara di Display Antrian">
                                                        {memproses(`ulang-${item.id}`) ? <Spinner className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />} {memproses(`ulang-${item.id}`) ? 'Memanggil...' : 'Panggil Ulang'}
                                                    </button>
                                                    <button disabled={isPending} onClick={() => jalankan(`mulai-${item.id}`, () => mulaiLayaniAntrian(item.id))}
                                                        className="inline-flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-amber-500/90 transition-colors disabled:opacity-50">
                                                        {memproses(`mulai-${item.id}`) ? <Spinner className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />} {memproses(`mulai-${item.id}`) ? 'Memproses...' : 'Mulai Layani'}
                                                    </button>
                                                </>
                                            )}
                                            {item.status === 'dilayani' && (
                                                <>
                                                    <button disabled={isPending} onClick={() => jalankan(`selesai-${item.id}`, () => selesaiAntrian(item.id))}
                                                        className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
                                                        {memproses(`selesai-${item.id}`) ? <Spinner className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />} {memproses(`selesai-${item.id}`) ? 'Menyimpan...' : 'Selesai'}
                                                    </button>
                                                    <button disabled={isPending} onClick={() => jalankan(`batal-${item.id}`, () => batalAntrian(item.id))}
                                                        className="inline-flex items-center gap-1.5 bg-paper-100 text-navy-950/60 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-paper-200 transition-colors disabled:opacity-50">
                                                        {memproses(`batal-${item.id}`) ? <Spinner className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} {memproses(`batal-${item.id}`) ? 'Membatalkan...' : 'Batal'}
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
