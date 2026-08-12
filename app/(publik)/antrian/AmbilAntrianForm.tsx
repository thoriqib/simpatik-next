'use client';

import { useActionState } from 'react';
import { ambilAntrian } from '@/lib/actions/antrian';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Ticket, BarChart3, FileText, Info, Check } from 'lucide-react';
import type { JenisLayanan } from '@/lib/types/database';

/**
 * Gaya per jenis layanan — dicocokkan lewat KODE (A/B/C) supaya stabil
 * biarpun urutan data dari database berubah. Warna: biru (Pelayanan
 * Statistik), hijau (Permintaan Informasi Publik), oranye (Umum).
 * Kode di luar A/B/C (jika suatu saat ditambah) otomatis dapat gaya
 * netral sebagai fallback, bukan error.
 */
const LAYANAN_STYLE: Record<string, { icon: typeof BarChart3; peer: string; dot: string; iconBg: string }> = {
    A: {
        icon: BarChart3,
        peer: 'peer-checked:border-azure-500 peer-checked:bg-azure-500/10 peer-checked:ring-2 peer-checked:ring-azure-500',
        dot: 'bg-azure-500',
        iconBg: 'bg-azure-500/10 text-azure-500',
    },
    B: {
        icon: FileText,
        peer: 'peer-checked:border-emerald-600 peer-checked:bg-emerald-600/10 peer-checked:ring-2 peer-checked:ring-emerald-600',
        dot: 'bg-emerald-600',
        iconBg: 'bg-emerald-600/10 text-emerald-600',
    },
    C: {
        icon: Info,
        peer: 'peer-checked:border-amber-500 peer-checked:bg-amber-500/10 peer-checked:ring-2 peer-checked:ring-amber-500',
        dot: 'bg-amber-500',
        iconBg: 'bg-amber-500/10 text-amber-500',
    },
};

const FALLBACK_STYLE = LAYANAN_STYLE.C;

export function AmbilAntrianForm({ jenisLayanan }: { jenisLayanan: JenisLayanan[] }) {
    const [state, formAction] = useActionState(ambilAntrian, null);

    return (
        <form action={formAction} className="space-y-4">
            {state?.error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">{state.error}</div>
            )}

            <div>
                <label className="block text-sm font-medium text-navy-950 mb-2">
                    Jenis Layanan <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2.5">
                    {jenisLayanan.map((j, i) => {
                        const style = LAYANAN_STYLE[j.kode] ?? FALLBACK_STYLE;
                        const Icon = style.icon;
                        return (
                            <label key={j.id} className="relative block cursor-pointer">
                                <input
                                    type="radio"
                                    name="jenis_layanan_id"
                                    value={j.id}
                                    required
                                    defaultChecked={i === 0}
                                    className="peer sr-only"
                                />
                                <div className={`flex items-center gap-3.5 border-2 border-paper-200 bg-white rounded-2xl px-4 py-3.5 transition-all ${style.peer}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
                                        <Icon className="w-5 h-5" strokeWidth={2} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-navy-950 text-sm">{j.nama_layanan}</div>
                                        {j.deskripsi && (
                                            <div className="text-xs text-navy-950/50 mt-0.5 line-clamp-1">{j.deskripsi}</div>
                                        )}
                                    </div>
                                    {/* Indikator terpilih — hanya tampil saat radio aktif */}
                                    <div className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity ${style.dot}`}>
                                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                    </div>
                                </div>
                            </label>
                        );
                    })}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-navy-950 mb-1.5">
                    Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input name="nama_pengunjung" required
                    className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500 transition-colors" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-navy-950 mb-1.5">No. HP</label>
                    <input name="no_hp" type="tel"
                        className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500 transition-colors" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-navy-950 mb-1.5">Email</label>
                    <input name="email" type="email"
                        className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500 transition-colors" />
                </div>
            </div>

            <SubmitButton className="w-full py-3.5 text-base mt-2" pendingText="Memproses...">
                <Ticket className="w-4 h-4" />
                Ambil Nomor Antrian
            </SubmitButton>
        </form>
    );
}
