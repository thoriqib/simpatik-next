import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { todayDateStringWIB } from '@/lib/utils';
import { PenilaianForm } from './PenilaianForm';
import type { Antrian } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export default async function PenilaianPage({ params }: { params: Promise<{ kode: string }> }) {
    const { kode } = await params;
    const supabase = await createClient();

    // [FIX] Cast eksplisit — relasi to-one (jenis_layanan, profiles) ditebak
    // sebagai array tanpa generated types.
    const { data: antrianRaw } = await supabase
        .from('antrian')
        .select('*, jenis_layanan(*), profiles(id, name), penilaian(id)')
        .eq('kode_antrian', kode)
        .eq('tanggal', todayDateStringWIB())
        .eq('status', 'selesai')
        .single();

    const antrian = antrianRaw as unknown as Antrian | null;

    // [Setara fix bug Laravel] Cek "belum dinilai" via hasil join, bukan whereNull kolom yang tidak ada
    if (!antrian || (antrian.penilaian && antrian.penilaian.length > 0) || !antrian.profiles) {
        notFound();
    }

    // Destructure ke variabel baru agar TypeScript mempersempit tipe (narrowing)
    // dengan andal setelah guard clause di atas — antrian.profiles sudah pasti ada.
    const profil = antrian.profiles;

    return (
        <>
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-navy-950">Penilaian Pelayanan</h2>
                <p className="text-sm text-navy-950/50 mt-1">Berikan penilaian untuk pelayanan yang Anda terima</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-paper-200 p-6">
                <div className="flex items-center gap-4 p-4 bg-azure-500/10 rounded-xl mb-6">
                    <div className="w-12 h-12 bg-navy-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {profil.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-semibold text-navy-950">{profil.name}</div>
                        <div className="text-sm text-navy-950/50">Antrian: {antrian.kode_antrian}</div>
                        <div className="text-sm text-navy-950/50">{antrian.jenis_layanan?.nama_layanan}</div>
                    </div>
                </div>

                <PenilaianForm antrianId={antrian.id} petugasId={profil.id} />
            </div>
        </>
    );
}
