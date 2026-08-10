'use client';

import { useState, useTransition } from 'react';
import { tambahHariLibur, hapusHariLibur } from '@/lib/actions/hari-libur';
import { Plus, X } from 'lucide-react';
import type { HariLibur } from '@/lib/types/database';

export function HariLiburManager({ hariKerja, hariLibur }: { hariKerja: string[]; hariLibur: HariLibur[] }) {
    const [isPending, startTransition] = useTransition();
    const [showForm, setShowForm] = useState(false);
    const [keterangan, setKeterangan] = useState('');
    const [error, setError] = useState('');

    const liburMap = new Map(hariLibur.map((h) => [h.tanggal, h]));
    const hariTersedia = hariKerja.filter((d) => !liburMap.has(d));
    const [tanggal, setTanggal] = useState(hariTersedia[0] ?? '');

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        startTransition(async () => {
            const res = await tambahHariLibur(tanggal, keterangan);
            if (res?.error) {
                setError(res.error);
            } else {
                setKeterangan('');
                setShowForm(false);
            }
        });
    }

    function handleHapus(id: number) {
        startTransition(async () => { await hapusHariLibur(id); });
    }

    return (
        <div>
            {/* Daftar hari libur minggu ini */}
            {hariLibur.length > 0 ? (
                <div className="space-y-2 mb-4">
                    {hariLibur.map((h) => (
                        <div key={h.id} className="flex items-center justify-between bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">
                            <div className="text-sm">
                                <span className="font-semibold text-rose-600">
                                    {new Date(h.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </span>
                                <span className="text-navy-950/60"> — {h.keterangan}</span>
                            </div>
                            <button
                                onClick={() => handleHapus(h.id)}
                                disabled={isPending}
                                className="text-rose-400 hover:text-rose-600 transition-colors disabled:opacity-50"
                                title="Hapus tanda libur"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-navy-950/40 mb-4">Tidak ada hari libur nasional pada minggu ini.</p>
            )}

            {!showForm ? (
                hariTersedia.length > 0 && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center gap-1.5 bg-paper-100 text-navy-950 px-4 py-2 rounded-xl text-sm font-medium hover:bg-paper-200 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Tandai Hari Libur
                    </button>
                )
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end bg-paper-50 rounded-xl p-4">
                    {error && <div className="w-full bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
                    <div>
                        <label className="block text-xs text-navy-950/50 mb-1">Tanggal</label>
                        <select value={tanggal} onChange={(e) => setTanggal(e.target.value)}
                            className="border border-paper-200 rounded-xl px-3 py-2 text-sm bg-white">
                            {hariTersedia.map((d) => (
                                <option key={d} value={d}>
                                    {new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 min-w-48">
                        <label className="block text-xs text-navy-950/50 mb-1">Keterangan</label>
                        <input
                            value={keterangan}
                            onChange={(e) => setKeterangan(e.target.value)}
                            required
                            placeholder="Contoh: Hari Buruh, Maulid Nabi Muhammad SAW"
                            className="w-full border border-paper-200 rounded-xl px-3 py-2 text-sm bg-white"
                        />
                    </div>
                    <button type="submit" disabled={isPending}
                        className="bg-navy-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors disabled:opacity-50">
                        {isPending ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <button type="button" onClick={() => { setShowForm(false); setError(''); }}
                        className="text-navy-950/50 text-sm px-3 py-2 hover:text-navy-950 transition-colors">
                        Batal
                    </button>
                </form>
            )}
        </div>
    );
}
