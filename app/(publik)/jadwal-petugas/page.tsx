import { createClient } from '@/lib/supabase/server';
import { formatTanggal } from '@/lib/utils';
import type { JadwalPublik, ShiftPiket } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

const STATUS_DOT: Record<string, string> = {
    hadir: 'bg-green-500', izin: 'bg-blue-400', sakit: 'bg-orange-400',
    alpha: 'bg-red-400', terjadwal: 'bg-navy-700',
};
const STATUS_TEXT: Record<string, string> = {
    hadir: 'text-green-600', izin: 'text-blue-500', sakit: 'text-orange-500', alpha: 'text-red-500',
};

function getMonthRange(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return { start, end };
}

export default async function JadwalPetugasPage({
    searchParams,
}: {
    searchParams: Promise<{ bulan?: string; tahun?: string }>;
}) {
    const params = await searchParams;
    const now = new Date();
    const bulan = Number(params.bulan) || now.getMonth() + 1;
    const tahun = Number(params.tahun) || now.getFullYear();

    const { start, end } = getMonthRange(tahun, bulan);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    const supabase = await createClient();
    const { data: jadwal } = await supabase
        .from('v_jadwal_publik')
        .select('*')
        .gte('tanggal', startStr)
        .lte('tanggal', endStr)
        .order('tanggal');

    const { data: shifts } = await supabase.from('shift_piket').select('*').eq('is_aktif', true).order('jam_mulai');

    const hariKerja: Date[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const day = d.getDay();
        if (day !== 0 && day !== 6) hariKerja.push(new Date(d));
    }

    const jadwalByTanggal = new Map<string, JadwalPublik[]>();
    (jadwal ?? []).forEach((j) => {
        const key = j.tanggal;
        if (!jadwalByTanggal.has(key)) jadwalByTanggal.set(key, []);
        jadwalByTanggal.get(key)!.push(j);
    });

    const bulanNama = start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const todayStr = new Date().toISOString().slice(0, 10);

    return (
        <>
            <div className="mb-5">
                <h2 className="text-xl font-bold text-navy-950">Jadwal Petugas Pelayanan</h2>
                <p className="text-sm text-navy-950/50 mt-1">Jadwal piket petugas Simpatik bulan {bulanNama}</p>
            </div>

            <form method="GET" className="bg-white rounded-xl border border-paper-200 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-end">
                <div>
                    <label className="block text-xs text-navy-950/50 mb-1">Bulan</label>
                    <select name="bulan" defaultValue={bulan} className="border border-paper-200 rounded-xl px-3 py-2 text-sm">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((b) => (
                            <option key={b} value={b}>
                                {new Date(2000, b - 1).toLocaleDateString('id-ID', { month: 'long' })}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-navy-950/50 mb-1">Tahun</label>
                    <select name="tahun" defaultValue={tahun} className="border border-paper-200 rounded-xl px-3 py-2 text-sm">
                        {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
                <button type="submit" className="bg-navy-700 text-white px-5 py-2 rounded-xl text-sm font-medium">Tampilkan</button>
            </form>

            {hariKerja.length > 0 ? (
                <div className="bg-white rounded-xl border border-paper-200 shadow-sm overflow-hidden">
                    <div className="grid border-b border-gray-200 bg-navy-700 text-white text-sm font-semibold"
                        style={{ gridTemplateColumns: `140px repeat(${shifts?.length ?? 1}, 1fr)` }}>
                        <div className="px-4 py-3">Tanggal</div>
                        {shifts?.map((shift) => (
                            <div key={shift.id} className="px-4 py-3 border-l border-blue-700">
                                <div>{shift.nama_shift}</div>
                                <div className="text-blue-200 text-xs font-normal">{shift.jam_mulai}–{shift.jam_selesai}</div>
                            </div>
                        ))}
                    </div>
                    {hariKerja.map((tgl) => {
                        const tglStr = tgl.toISOString().slice(0, 10);
                        const jadwalHari = jadwalByTanggal.get(tglStr) ?? [];
                        const isToday = tglStr === todayStr;
                        return (
                            <div key={tglStr}
                                className={`grid border-b border-paper-200 last:border-0 text-sm ${isToday ? 'bg-azure-500/10' : 'hover:bg-paper-50'} transition`}
                                style={{ gridTemplateColumns: `140px repeat(${shifts?.length ?? 1}, 1fr)` }}>
                                <div className="px-4 py-4 border-r border-paper-200">
                                    <div className={`font-semibold ${isToday ? 'text-navy-700' : 'text-navy-950/80'}`}>
                                        {tgl.toLocaleDateString('id-ID', { weekday: 'short' })}
                                        {isToday && <span className="ml-1 text-xs bg-navy-700 text-white px-1.5 py-0.5 rounded">Hari ini</span>}
                                    </div>
                                    <div className="text-navy-950/50 text-xs mt-0.5">{tgl.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</div>
                                </div>
                                {shifts?.map((shift: ShiftPiket) => {
                                    const petugasShift = jadwalHari.filter((j) => j.shift_id === shift.id);
                                    return (
                                        <div key={shift.id} className="px-4 py-4 border-r border-paper-200 last:border-0">
                                            {petugasShift.length === 0 ? (
                                                <span className="text-navy-950/20 text-xs italic">—</span>
                                            ) : (
                                                <div className="space-y-1.5">
                                                    {petugasShift.map((j) => (
                                                        <div key={j.id} className="flex items-center gap-2">
                                                            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${STATUS_DOT[j.status]}`}>
                                                                {j.nama_petugas.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-medium text-navy-950 leading-tight">{j.nama_petugas}</div>
                                                                {j.status !== 'terjadwal' && (
                                                                    <div className={`text-xs leading-tight ${STATUS_TEXT[j.status]}`}>
                                                                        {j.status.charAt(0).toUpperCase() + j.status.slice(1)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-paper-200 p-10 text-center text-navy-950/30">Tidak ada hari kerja di bulan ini.</div>
            )}

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-navy-950/50">
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-navy-700 inline-block" /> Terjadwal</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-green-500 inline-block" /> Hadir</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-blue-400 inline-block" /> Izin</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-orange-400 inline-block" /> Sakit</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-red-400 inline-block" /> Alpha</span>
            </div>
        </>
    );
}
