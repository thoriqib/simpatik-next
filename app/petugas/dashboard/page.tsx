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

    const menunggu = antrianAktif?.filter((a) => a.status === 'menunggu').length ?? 0;
    const selesai = antrianAktif?.filter((a) => a.status === 'selesai').length ?? 0;

    return (
        <>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-navy-950 tracking-tight">Dashboard</h1>
                <p className="text-sm text-navy-950/50 mt-0.5">Presensi & antrian pelayanan hari ini</p>
            </div>

            <PresensiPanel jadwalHariIni={jadwalHariIni ?? null} />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 mb-5">
                <Card className="!p-5 text-center">
                    <div className="font-mono text-3xl font-semibold text-navy-700 tabular">{antrianSaya ?? 0}</div>
                    <div className="text-xs text-navy-950/50 mt-1">Antrian Saya Hari Ini</div>
                </Card>
                <Card className="!p-5 text-center">
                    <div className="font-mono text-3xl font-semibold text-amber-500 tabular">{menunggu}</div>
                    <div className="text-xs text-navy-950/50 mt-1">Antrian Menunggu</div>
                </Card>
                <Card className="!p-5 text-center col-span-2 sm:col-span-1">
                    <div className="font-mono text-3xl font-semibold text-emerald-600 tabular">{selesai}</div>
                    <div className="text-xs text-navy-950/50 mt-1">Selesai Hari Ini</div>
                </Card>
            </div>

            <AntrianPanel antrianAktif={antrianAktif ?? []} petugasId={user!.id} />
        </>
    );
}
