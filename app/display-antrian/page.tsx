import { createClient } from '@/lib/supabase/server';
import { todayDateStringWIB } from '@/lib/utils';
import { DisplayBoard } from './DisplayBoard';

export const dynamic = 'force-dynamic';

export default async function DisplayAntrianPage() {
    const supabase = await createClient();
    const today = todayDateStringWIB();

    const { data: antrianAktif } = await supabase
        .from('antrian')
        .select('*, jenis_layanan(*), profiles(name)')
        .eq('tanggal', today)
        .in('status', ['dipanggil', 'dilayani'])
        .order('waktu_panggil', { ascending: false })
        .limit(10);

    const { count: menunggu } = await supabase
        .from('antrian').select('*', { count: 'exact', head: true })
        .eq('tanggal', today).eq('status', 'menunggu');

    const { count: selesai } = await supabase
        .from('antrian').select('*', { count: 'exact', head: true })
        .eq('tanggal', today).eq('status', 'selesai');

    return (
        <DisplayBoard
            initialAntrian={antrianAktif ?? []}
            initialMenunggu={menunggu ?? 0}
            initialSelesai={selesai ?? 0}
        />
    );
}
