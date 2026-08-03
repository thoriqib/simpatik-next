import { createClient } from '@/lib/supabase/server';
import { AmbilAntrianForm } from './AmbilAntrianForm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
    const supabase = await createClient();
    const { data: jenisLayanan } = await supabase
        .from('jenis_layanan')
        .select('*')
        .eq('is_aktif', true)
        .order('kode');

    return (
        <>
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Ambil Nomor Antrian</h2>
                <p className="text-sm text-gray-500 mt-1">Isi data di bawah untuk mendapatkan nomor antrian Anda</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <AmbilAntrianForm jenisLayanan={jenisLayanan ?? []} />
            </div>

            <div className="mt-5 flex justify-center gap-6 text-sm">
                <Link href="/display-antrian" className="text-blue-600 hover:underline">📺 Lihat Display Antrian</Link>
                <Link href="/pengaduan" className="text-gray-500 hover:underline">📢 Kirim Pengaduan</Link>
            </div>
        </>
    );
}
