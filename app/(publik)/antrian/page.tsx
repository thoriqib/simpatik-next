import { createClient } from '@/lib/supabase/server';
import { AmbilAntrianForm } from './AmbilAntrianForm';
import Link from 'next/link';
import { MonitorPlay, MessageSquareWarning } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AntrianPage() {
    const supabase = await createClient();
    const { data: jenisLayanan } = await supabase
        .from('jenis_layanan')
        .select('*')
        .eq('is_aktif', true)
        .order('kode');

    return (
        <>
            <div className="mb-7">
                <h1 className="text-2xl font-bold text-navy-950 tracking-tight">Ambil Nomor Antrian</h1>
                <p className="text-sm text-navy-950/50 mt-1">Isi data di bawah untuk mendapatkan nomor antrian pelayanan Anda</p>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-paper-200 p-6 sm:p-7">
                <AmbilAntrianForm jenisLayanan={jenisLayanan ?? []} />
            </div>

            <div className="mt-6 flex justify-center gap-6 text-sm">
                <Link href="/display-antrian" className="inline-flex items-center gap-1.5 text-azure-500 hover:text-navy-700 font-medium transition-colors">
                    <MonitorPlay className="w-4 h-4" />
                    Display Antrian
                </Link>
                <Link href="/pengaduan" className="inline-flex items-center gap-1.5 text-navy-950/50 hover:text-navy-950 transition-colors">
                    <MessageSquareWarning className="w-4 h-4" />
                    Kirim Pengaduan
                </Link>
            </div>
        </>
    );
}
