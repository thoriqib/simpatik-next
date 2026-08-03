import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { todayDateStringWIB } from '@/lib/utils';
import { PresensiPanel } from './PresensiPanel';
import { AntrianPanel } from './AntrianPanel';

export const dynamic = 'force-dynamic';

export default async function PetugasDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const today = todayDateStringWIB();

    const { data: jadwalHariIni } = await supabase
        .from('jadwal_piket')
        .select('*, shift_piket(*), presensi(*)')
        .eq('user_id', user!.id)
        .eq('tanggal', today)
        .maybeSingle();

    const { data: antrianAktif } = await supabase
        .from('antrian')
        .select('*, jenis_layanan(*)')
        .eq('tanggal', today)
        .in('status', ['menunggu', 'dipanggil', 'dilayani'])
        .order('nomor_urut');

    const { count: antrianSaya } = await supabase
        .from('antrian').select('*', { count: 'exact', head: true })
        .eq('petugas_id', user!.id).eq('tanggal', today);

    return (
        <>
            <h1 className="text-lg font-semibold text-gray-800 mb-4">Dashboard</h1>

            <PresensiPanel jadwalHariIni={jadwalHariIni ?? null} />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 mb-5">
                <Card><div className="text-center"><div className="text-3xl font-bold text-blue-700">{antrianSaya ?? 0}</div><div className="text-xs text-gray-500 mt-1">Antrian Saya Hari Ini</div></div></Card>
                <Card><div className="text-center"><div className="text-3xl font-bold text-yellow-600">{antrianAktif?.filter((a) => a.status === 'menunggu').length ?? 0}</div><div className="text-xs text-gray-500 mt-1">Antrian Menunggu</div></div></Card>
                <Card className="col-span-2 sm:col-span-1"><div className="text-center"><div className="text-3xl font-bold text-green-600">{antrianAktif?.filter((a) => a.status === 'selesai').length ?? 0}</div><div className="text-xs text-gray-500 mt-1">Selesai Hari Ini</div></div></Card>
            </div>

            <AntrianPanel antrianAktif={antrianAktif ?? []} petugasId={user!.id} />
        </>
    );
}
