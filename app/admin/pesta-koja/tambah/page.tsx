import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { LinkForm } from '../LinkForm';

export default function TambahLinkPestaKojaPage() {
    return (
        <>
            <div className="flex items-center gap-2 text-sm text-navy-950/50 mb-5">
                <Link href="/admin/pesta-koja" className="hover:text-azure-500">Pesta Koja</Link>
                <span>/</span>
                <span className="text-navy-950 font-medium">Tambah Link</span>
            </div>

            <Card title="Tambah Link Baru">
                <LinkForm />
            </Card>
        </>
    );
}
