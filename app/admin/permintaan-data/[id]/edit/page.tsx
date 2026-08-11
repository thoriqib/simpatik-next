import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { EditForm } from './EditForm';
import type { PermintaanData } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export default async function EditPermintaanDataPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: permintaanRaw } = await supabase.from('permintaan_data').select('*').eq('id', id).single();
    const permintaan = permintaanRaw as unknown as PermintaanData | null;
    if (!permintaan) notFound();

    return (
        <>
            <div className="flex items-center gap-2 text-sm text-navy-950/50 mb-5">
                <Link href="/admin/permintaan-data" className="hover:text-azure-500">Permintaan Data</Link>
                <span>/</span>
                <Link href={`/admin/permintaan-data/${id}`} className="hover:text-azure-500">{permintaan.nama_lengkap}</Link>
                <span>/</span>
                <span className="text-navy-950 font-medium">Edit</span>
            </div>

            <Card title="Edit Permintaan Data" description="Gunakan ini untuk mengoreksi data yang salah ketik dari pengunjung.">
                <EditForm permintaan={permintaan} />
            </Card>
        </>
    );
}
