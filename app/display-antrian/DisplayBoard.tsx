'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/Badge';
import { todayDateStringWIB } from '@/lib/utils';
import type { Antrian } from '@/lib/types/database';

/**
 * Board display antrian ruang tunggu.
 * Memakai Supabase Realtime (postgres_changes) untuk update otomatis
 * setiap ada perubahan status antrian — jauh lebih instan dibanding
 * pendekatan <meta http-equiv="refresh" content="10"> di versi Laravel.
 */
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

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#003580] flex flex-col text-white">
            <div className="flex items-center justify-between px-10 py-5 border-b border-blue-700">
                <div>
                    <div className="text-xl font-bold">Simpatik</div>
                    <div className="text-blue-200 text-sm">Sistem Informasi Pelayanan Statistik — BPS Kota Jambi</div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-mono font-bold">{jam || '--:--:--'}</div>
                    <div className="text-blue-200 text-sm">
                        {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-3 gap-6 p-8">
                <div className="col-span-2 space-y-4">
                    <h2 className="text-lg font-semibold text-blue-200 uppercase tracking-wider mb-4">Sedang Dilayani</h2>
                    {antrian.length > 0 ? antrian.map((item) => (
                        <div key={item.id} className="bg-white bg-opacity-10 backdrop-blur rounded-2xl px-8 py-5 flex items-center justify-between border border-white border-opacity-20">
                            <div>
                                <div className="text-5xl font-black tracking-tight">{item.kode_antrian}</div>
                                <div className="text-blue-200 text-sm mt-1">{item.jenis_layanan?.nama_layanan}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-semibold">{item.profiles?.name ?? 'Loket'}</div>
                                <Badge status={item.status} />
                            </div>
                        </div>
                    )) : (
                        <div className="bg-white bg-opacity-5 rounded-2xl px-8 py-12 text-center text-blue-300">
                            Belum ada antrian yang dipanggil
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="bg-white bg-opacity-10 rounded-2xl p-6 text-center border border-white border-opacity-20">
                        <div className="text-blue-200 text-sm uppercase tracking-wider mb-2">Menunggu</div>
                        <div className="text-8xl font-black">{menunggu}</div>
                        <div className="text-blue-200 text-sm mt-1">antrian</div>
                    </div>
                    <div className="bg-white bg-opacity-10 rounded-2xl p-6 text-center border border-white border-opacity-20">
                        <div className="text-blue-200 text-sm uppercase tracking-wider mb-2">Selesai Hari Ini</div>
                        <div className="text-5xl font-black text-green-300">{selesai}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
