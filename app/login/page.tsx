'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { login } from '@/lib/actions/auth';
import { SubmitButton } from '@/components/ui/SubmitButton';

export default function LoginPage() {
    const [state, formAction] = useActionState(login, null);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="bg-[#003580] px-8 py-8 text-center text-white">
                        <h1 className="text-xl font-bold">Simpatik</h1>
                        <p className="text-blue-200 text-sm mt-1">Sistem Informasi Pelayanan Statistik — BPS Kota Jambi</p>
                    </div>

                    <div className="px-8 py-8">
                        <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">Masuk ke Sistem</h2>

                        {state?.error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
                                {state.error}
                            </div>
                        )}

                        <form action={formAction} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email" name="email" required autoFocus
                                    placeholder="nama@bps-jambi.go.id"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003580]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'} name="password" required
                                        placeholder="••••••••"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm pr-11 focus:outline-none focus:ring-2 focus:ring-[#003580]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
                                    >
                                        {showPassword ? '🙈' : '👁'}
                                    </button>
                                </div>
                            </div>
                            <SubmitButton className="w-full py-3">Masuk</SubmitButton>
                        </form>
                    </div>
                </div>

                <div className="text-center mt-5">
                    <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 hover:underline">
                        ← Kembali ke Halaman Antrian
                    </Link>
                </div>
                <p className="text-center text-xs text-gray-400 mt-3">
                    © {new Date().getFullYear()} Simpatik — BPS Kota Jambi.
                </p>
            </div>
        </div>
    );
}
