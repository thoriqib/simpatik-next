'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Send, CalendarClock, UserRoundCheck } from 'lucide-react';
import { ajukanGantiJadwal } from '@/lib/actions/ganti-jadwal';

export interface OpsiJadwal { id: number; label: string; sudahAdaRequest: boolean }
export interface OpsiShift { id: number; label: string }
export interface OpsiRekan { id: string; nama: string }

export function GantiJadwalForm({ jadwal, shifts, rekan }: { jadwal: OpsiJadwal[]; shifts: OpsiShift[]; rekan: OpsiRekan[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [jadwalId, setJadwalId] = useState('');
    const [jenis, setJenis] = useState<'pindah' | 'digantikan'>('digantikan');
    const [tanggalBaru, setTanggalBaru] = useState('');
    const [shiftBaruId, setShiftBaruId] = useState('');
    const [penggantiId, setPenggantiId] = useState('');
    const [alasan, setAlasan] = useState('');
    const [pesan, setPesan] = useState<{ tipe: 'error' | 'success'; teks: string } | null>(null);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setPesan(null);
        if (!jadwalId) { setPesan({ tipe: 'error', teks: 'Pilih jadwal yang ingin diganti.' }); return; }

        startTransition(async () => {
            const res = await ajukanGantiJadwal({
                jadwalPiketId: Number(jadwalId),
                jenis,
                alasan,
                tanggalBaru: jenis === 'pindah' ? tanggalBaru : undefined,
                shiftBaruId: jenis === 'pindah' ? Number(shiftBaruId) : undefined,
                penggantiId: jenis === 'digantikan' ? penggantiId : undefined,
            });
            if (res.error) { setPesan({ tipe: 'error', teks: res.error }); return; }
            setPesan({ tipe: 'success', teks: res.success ?? 'Request terkirim.' });
            setJadwalId(''); setTanggalBaru(''); setShiftBaruId(''); setPenggantiId(''); setAlasan('');
            router.refresh();
        });
    }

    const input = 'w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500 disabled:opacity-60';
    const label = 'block text-sm font-medium text-navy-950 mb-1.5';

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {pesan && (
                <div className={`px-4 py-3 rounded-xl text-sm border ${pesan.tipe === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                    {pesan.teks}
                </div>
            )}

            <div>
                <label className={label}>Jadwal yang ingin diganti <span className="text-rose-500">*</span></label>
                <select value={jadwalId} onChange={(e) => setJadwalId(e.target.value)} disabled={isPending} required className={input}>
                    <option value="">— Pilih jadwal —</option>
                    {jadwal.map((j) => (
                        <option key={j.id} value={j.id} disabled={j.sudahAdaRequest}>
                            {j.label}{j.sudahAdaRequest ? ' (sudah ada request menunggu)' : ''}
                        </option>
                    ))}
                </select>
                {jadwal.length === 0 && <p className="text-xs text-navy-950/40 mt-1.5">Tidak ada jadwal mendatang yang bisa diganti.</p>}
            </div>

            <div>
                <label className={label}>Cara penggantian</label>
                <div className="grid sm:grid-cols-2 gap-3">
                    <button type="button" disabled={isPending} onClick={() => setJenis('digantikan')}
                        className={`text-left p-3.5 rounded-xl border text-sm transition-colors disabled:opacity-60 ${jenis === 'digantikan' ? 'border-navy-700 bg-navy-700/5' : 'border-paper-200 hover:bg-paper-50'}`}>
                        <span className="flex items-center gap-2 font-semibold text-navy-950"><UserRoundCheck className="w-4 h-4" /> Digantikan rekan</span>
                        <span className="block text-xs text-navy-950/50 mt-1">Rekan petugas mengambil alih jadwal ini.</span>
                    </button>
                    <button type="button" disabled={isPending} onClick={() => setJenis('pindah')}
                        className={`text-left p-3.5 rounded-xl border text-sm transition-colors disabled:opacity-60 ${jenis === 'pindah' ? 'border-navy-700 bg-navy-700/5' : 'border-paper-200 hover:bg-paper-50'}`}>
                        <span className="flex items-center gap-2 font-semibold text-navy-950"><CalendarClock className="w-4 h-4" /> Pindah ke hari/shift lain</span>
                        <span className="block text-xs text-navy-950/50 mt-1">Jadwal ini dipindah, tetap Anda yang bertugas.</span>
                    </button>
                </div>
            </div>

            {jenis === 'digantikan' ? (
                <div>
                    <label className={label}>Petugas pengganti <span className="text-rose-500">*</span></label>
                    <select value={penggantiId} onChange={(e) => setPenggantiId(e.target.value)} disabled={isPending} required className={input}>
                        <option value="">— Pilih rekan —</option>
                        {rekan.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
                    </select>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className={label}>Tanggal tujuan <span className="text-rose-500">*</span></label>
                        <input type="date" value={tanggalBaru} onChange={(e) => setTanggalBaru(e.target.value)} disabled={isPending} required className={input} />
                    </div>
                    <div>
                        <label className={label}>Shift tujuan <span className="text-rose-500">*</span></label>
                        <select value={shiftBaruId} onChange={(e) => setShiftBaruId(e.target.value)} disabled={isPending} required className={input}>
                            <option value="">— Pilih shift —</option>
                            {shifts.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                    </div>
                </div>
            )}

            <div>
                <label className={label}>Alasan <span className="text-rose-500">*</span></label>
                <textarea value={alasan} onChange={(e) => setAlasan(e.target.value)} disabled={isPending} required rows={3} maxLength={500}
                    placeholder="Contoh: Ada dinas luar / acara keluarga / keperluan mendesak"
                    className={`${input} resize-none`} />
            </div>

            <button type="submit" disabled={isPending || jadwal.length === 0}
                className="inline-flex items-center justify-center gap-2 bg-navy-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-navy-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isPending ? 'Mengirim request...' : 'Kirim Request ke Admin'}
            </button>
        </form>
    );
}
