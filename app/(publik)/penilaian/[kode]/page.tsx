import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { todayDateStringWIB } from '@/lib/utils';
import { PenilaianForm } from './PenilaianForm';

export const dynamic = 'force-dynamic';

export default async function PenilaianPage({ params }: { params: Promise<{ kode: string }> }) {
    const { kode } = await params;
    const supabase = await createClient();

    const { data: antrian } = await supabase
        .from('antrian')
        .select('*, jenis_layanan(*), profiles(id, name), penilaian(id)')
        .eq('kode_antrian', kode)
        .eq('tanggal', todayDateStringWIB())
        .eq('status', 'selesai')
        .single();

    // [Setara fix bug Laravel] Cek "belum dinilai" via hasil join, bukan whereNull kolom yang tidak ada
    if (!antrian || (antrian.penilaian && antrian.penilaian.length > 0) || !antrian.profiles) {
        notFound();
    }

    return (
        <>
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Penilaian Pelayanan</h2>
                <p className="text-sm text-gray-500 mt-1">Berikan penilaian untuk pelayanan yang Anda terima</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl mb-6">
                    <div className="w-12 h-12 bg-[#003580] rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {antrian.profiles.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-semibold text-gray-800">{antrian.profiles.name}</div>
                        <div className="text-sm text-gray-500">Antrian: {antrian.kode_antrian}</div>
                        <div className="text-sm text-gray-500">{antrian.jenis_layanan.nama_layanan}</div>
                    </div>
                </div>

                <PenilaianForm antrianId={antrian.id} petugasId={antrian.profiles.id} />
            </div>
        </>
    );
}
