'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/Badge';
import { todayDateStringWIB } from '@/lib/utils';
import type { Antrian } from '@/lib/types/database';

export function DisplayBoard({
    initialAntrian,
    initialMenunggu,
    initialSelesai,
}: {
    initialAntrian: Antrian[];
    initialMenunggu: number;
    initialSelesai: number;
}) {
    const [antrian, setAntrian] = useState(initialAntrian);
    const [menunggu, setMenunggu] = useState(initialMenunggu);
    const [selesai, setSelesai] = useState(initialSelesai);
    const [jam, setJam] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setJam(new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const supabase = createClient();

        async function refetch() {
            const today = todayDateStringWIB();

            const { data } = await supabase
                .from('antrian')
                .select('*, jenis_layanan(*), profiles(name)')
                .eq('tanggal', today)
                .in('status', ['dipanggil', 'dilayani'])
                .order('waktu_panggil', { ascending: false })
                .limit(10);
            setAntrian((data as Antrian[]) ?? []);

            const { count: m } = await supabase.from('antrian').select('*', { count: 'exact', head: true })
                .eq('tanggal', today).eq('status', 'menunggu');
            setMenunggu(m ?? 0);

            const { count: s } = await supabase.from('antrian').select('*', { count: 'exact', head: true })
                .eq('tanggal', today).eq('status', 'selesai');
            setSelesai(s ?? 0);
        }

        const channel = supabase
            .channel('display-antrian')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'antrian' }, refetch)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    return (
        <div className="min-h-screen bg-navy-950 flex flex-col text-white">
            <div className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-azure-500 to-navy-700 flex items-center justify-center font-bold text-sm shrink-0">S</div>
                    <div>
                        <div className="text-lg sm:text-xl font-bold tracking-tight">Simpatik</div>
                        <div className="text-white/40 text-xs sm:text-sm">Sistem Informasi Pelayanan Statistik — BPS Kota Jambi</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="font-mono text-xl sm:text-2xl font-semibold tabular">{jam || '--:--:--'}</div>
                    <div className="text-white/40 text-xs sm:text-sm">
                        {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 sm:p-8">
                <div className="lg:col-span-2 space-y-3">
                    <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">Sedang Dilayani</h2>
                    {antrian.length > 0 ? antrian.map((item) => (
                        <div key={item.id} className="bg-white/[0.06] rounded-2xl px-6 sm:px-8 py-5 flex items-center justify-between border border-white/10">
                            <div>
                                <div className="font-mono text-4xl sm:text-5xl font-semibold tracking-tight tabular">{item.kode_antrian}</div>
                                <div className="text-white/40 text-sm mt-1">{item.jenis_layanan?.nama_layanan}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-base sm:text-lg font-semibold">{item.profiles?.name ?? 'Loket'}</div>
                                <div className="mt-1"><Badge status={item.status} /></div>
                            </div>
                        </div>
                    )) : (
                        <div className="bg-white/[0.03] rounded-2xl px-8 py-14 text-center text-white/30 border border-white/5">
                            Belum ada antrian yang dipanggil
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="bg-white/[0.06] rounded-2xl p-6 text-center border border-white/10">
                        <div className="text-white/40 text-xs sm:text-sm uppercase tracking-widest mb-2">Menunggu</div>
                        <div className="font-mono text-6xl sm:text-8xl font-semibold tabular">{menunggu}</div>
                        <div className="text-white/40 text-sm mt-1">antrian</div>
                    </div>
                    <div className="bg-white/[0.06] rounded-2xl p-6 text-center border border-white/10">
                        <div className="text-white/40 text-xs sm:text-sm uppercase tracking-widest mb-2">Selesai Hari Ini</div>
                        <div className="font-mono text-4xl sm:text-5xl font-semibold text-emerald-400 tabular">{selesai}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
