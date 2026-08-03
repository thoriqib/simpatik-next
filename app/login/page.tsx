'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { login } from '@/lib/actions/auth';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
    const [state, formAction] = useActionState(login, null);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Tekstur kertas grafik — signature visual, referensi identitas statistik */}
            <div className="absolute inset-0 bg-grid-dot opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(circle, rgb(255 255 255 / 0.15) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

            <div className="w-full max-w-md relative">
                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-azure-500 to-navy-700 flex items-center justify-center font-bold text-xl text-white mx-auto mb-4 shadow-card">
                        S
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Simpatik</h1>
                    <p className="text-white/40 text-sm mt-1">Sistem Informasi Pelayanan Statistik — BPS Kota Jambi</p>
                </div>

                <div className="bg-white rounded-2xl shadow-card p-8">
                    <h2 className="text-base font-semibold text-navy-950 mb-6">Masuk ke Sistem</h2>

                    {state?.error && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl mb-5 text-sm">
                            {state.error}
                        </div>
                    )}

                    <form action={formAction} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-navy-950 mb-1.5">Email</label>
                            <input
                                type="email" name="email" required autoFocus
                                placeholder="nama@bps-jambi.go.id"
                                className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-navy-950 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'} name="password" required
                                    placeholder="••••••••"
                                    className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500 transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-950/30 hover:text-navy-950/60"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <SubmitButton className="w-full py-3">Masuk</SubmitButton>
                    </form>
                </div>

                <div className="text-center mt-6">
                    <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Kembali ke Halaman Antrian
                    </Link>
                </div>
                <p className="text-center text-xs text-white/25 mt-4">
                    © {new Date().getFullYear()} Simpatik — BPS Kota Jambi
                </p>
            </div>
        </div>
    );
}
