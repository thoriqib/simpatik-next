'use client';

import { useState, useTransition } from 'react';
import { resetPasswordMassal } from '@/lib/actions/auth';
import { ConfirmModal } from '@/components/ui/Modal';
import { KeyRound, CheckCircle2, AlertTriangle } from 'lucide-react';

/**
 * Reset password SEMUA akun staf (petugas + admin) jadi "pst1571" lewat
 * satu tombol — jalan langsung di server produksi (Vercel), tidak perlu
 * jalankan skrip lokal. Aksi ini berdampak besar (ubah password semua
 * orang sekaligus), jadi dijaga dengan modal konfirmasi + peringatan
 * tegas sebelum dieksekusi.
 */
export function ResetPasswordMassalButton() {
    const [confirm, setConfirm] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [hasil, setHasil] = useState<{ berhasil: number; gagal: number; error?: string } | null>(null);

    function handleReset() {
        startTransition(async () => {
            const res = await resetPasswordMassal();
            setHasil(res);
            setConfirm(false);
        });
    }

    return (
        <div className="bg-white rounded-2xl shadow-soft border border-paper-200 p-6">
            <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-navy-950 mb-1">Reset Password Massal</h3>
                    <p className="text-xs text-navy-950/50 leading-relaxed mb-4">
                        Reset password <strong>seluruh akun staf</strong> (petugas & admin) jadi satu
                        password seragam: <code className="bg-paper-100 px-1.5 py-0.5 rounded font-mono">pst1571</code>.
                        Sarankan setiap orang segera ganti password sendiri setelah login berikutnya.
                    </p>
                    <button
                        onClick={() => setConfirm(true)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
                    >
                        <KeyRound className="w-4 h-4" />
                        {isPending ? 'Memproses...' : 'Reset Semua Password'}
                    </button>

                    {hasil && (
                        <div className={`mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-xs ${hasil.error ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                            {hasil.error ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                            <span>
                                {hasil.error ? hasil.error : `Selesai — ${hasil.berhasil} akun berhasil direset${hasil.gagal > 0 ? `, ${hasil.gagal} gagal` : ''}.`}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                open={confirm}
                onClose={() => setConfirm(false)}
                onConfirm={handleReset}
                pending={isPending}
                title="Reset Password Semua Akun?"
                message='Password SELURUH akun staf (petugas & admin) akan diganti jadi "pst1571". Tindakan ini tidak bisa dibatalkan setelah dijalankan.'
                confirmText="Ya, Reset Semua"
                pendingText="Mereset..."
                variant="danger"
            />
        </div>
    );
}
