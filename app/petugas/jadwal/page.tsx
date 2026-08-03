import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

export default async function JadwalPetugasSayaPage({ searchParams }: { searchParams: Promise<{ bulan?: string; tahun?: string }> }) {
    const params = await searchParams;
    const now = new Date();
    const bulan = Number(params.bulan) || now.getMonth() + 1;
    const tahun = Number(params.tahun) || now.getFullYear();
    const start = new Date(tahun, bulan - 1, 1).toISOString().slice(0, 10);
    const end = new Date(tahun, bulan, 0).toISOString().slice(0, 10);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: jadwal } = await supabase
        .from('jadwal_piket')
        .select('*, shift_piket(*), presensi(*)')
        .eq('user_id', user!.id)
        .gte('tanggal', start).lte('tanggal', end)
        .order('tanggal');

    const rekap = { hadir: 0, izin: 0, sakit: 0, alpha: 0, terjadwal: 0 };
    (jadwal ?? []).forEach((j) => { rekap[j.status as keyof typeof rekap]++; });
    const bulanNama = new Date(tahun, bulan - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const todayStr = new Date().toISOString().slice(0, 10);

    return (
        <>
            <h1 className="text-lg font-semibold text-navy-950 mb-4">Jadwal Piket Saya</h1>

            <Card className="mb-5">
                <form method="GET" className="flex flex-wrap gap-3 items-end">
                    <div>
                        <label className="block text-sm font-medium text-navy-950/80 mb-1">Bulan</label>
                        <select name="bulan" defaultValue={bulan} className="border border-paper-200 rounded-xl px-3 py-2 text-sm">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((b) => <option key={b} value={b}>{new Date(2000, b - 1).toLocaleDateString('id-ID', { month: 'long' })}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-navy-950/80 mb-1">Tahun</label>
                        <select name="tahun" defaultValue={tahun} className="border border-paper-200 rounded-xl px-3 py-2 text-sm">
                            {[tahun - 1, tahun, tahun + 1].map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="bg-navy-700 text-white px-4 py-2 rounded-xl text-sm font-medium">Tampilkan</button>
                </form>
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
                {[['Hadir', rekap.hadir, 'bg-green-100 text-green-700'], ['Izin', rekap.izin, 'bg-blue-100 text-navy-700'],
                  ['Sakit', rekap.sakit, 'bg-orange-100 text-orange-700'], ['Alpha', rekap.alpha, 'bg-red-100 text-red-700'],
                  ['Terjadwal', rekap.terjadwal, 'bg-paper-100 text-navy-950/60']].map(([label, val, color]) => (
                    <div key={label as string} className="bg-white rounded-xl border border-paper-200 p-4 text-center">
                        <div className={`text-2xl font-bold ${color} rounded-xl py-1 mb-1`}>{val}</div>
                        <div className="text-xs text-navy-950/50">{label}</div>
                    </div>
                ))}
            </div>

            <Card title={`Jadwal Bulan ${bulanNama}`}>
                {jadwal && jadwal.length > 0 ? jadwal.map((item) => {
                    const tgl = new Date(item.tanggal);
                    const isToday = item.tanggal === todayStr;
                    const p = item.presensi?.[0];
                    return (
                        <div key={item.id} className="flex items-center justify-between py-3 border-b border-paper-200 last:border-0">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-center ${isToday ? 'bg-navy-700 text-white' : 'bg-paper-100 text-navy-950/80'}`}>
                                    <div className="text-xs leading-none">{tgl.toLocaleDateString('id-ID', { weekday: 'short' })}</div>
                                    <div className="text-lg font-bold leading-tight">{tgl.getDate()}</div>
                                </div>
                                <div>
                                    <div className="font-medium text-sm text-navy-950">{item.shift_piket?.nama_shift}</div>
                                    <div className="text-xs text-navy-950/50">{item.shift_piket?.jam_mulai}–{item.shift_piket?.jam_selesai}</div>
                                    {p && (
                                        <div className="text-xs text-navy-950/30 mt-0.5">
                                            Masuk: {p.waktu_masuk ? new Date(p.waktu_masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) : '-'} |
                                            Keluar: {p.waktu_keluar ? new Date(p.waktu_keluar).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) : '-'}
                                            {p.kekurangan_menit > 0 && <span className="text-red-500 font-medium"> · Kurang {Math.floor(p.kekurangan_menit / 60)}j {p.kekurangan_menit % 60}m</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Badge status={item.status} />
                        </div>
                    );
                }) : <div className="py-10 text-center text-navy-950/30 text-sm">Tidak ada jadwal piket untuk bulan ini</div>}
            </Card>
        </>
    );
}
