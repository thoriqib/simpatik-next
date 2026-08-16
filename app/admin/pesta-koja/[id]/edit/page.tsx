import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { LinkForm } from '../../LinkForm';
import type { PestaKojaLink } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export default async function EditLinkPestaKojaPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: linkRaw } = await supabase.from('pesta_koja_link').select('*').eq('id', id).single();
    const link = linkRaw as PestaKojaLink | null;
    if (!link) notFound();

    return (
        <>
            <div className="flex items-center gap-2 text-sm text-navy-950/50 mb-5">
                <Link href="/admin/pesta-koja" className="hover:text-azure-500">Pesta Koja</Link>
                <span>/</span>
                <span className="text-navy-950 font-medium">Edit — {link.judul}</span>
            </div>

            <Card title="Edit Link">
                <LinkForm link={link} />
            </Card>
        </>
    );
}
