import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { getPestaKojaIcon } from '@/lib/pesta-koja-icons';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { unstable_noStore as noStore } from 'next/cache';
import { UrutanButtons, ToggleAktif, HapusLinkButton } from './LinkRowActions';
import type { PestaKojaLink } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export default async function PestaKojaAdminPage() {
    noStore();

    const supabase = await createClient();
    const { data: linkList } = await supabase.from('pesta_koja_link').select('*').order('urutan');
    const links = (linkList ?? []) as PestaKojaLink[];

    return (
        <>
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-lg font-semibold text-navy-950">Pesta Koja</h1>
                    <p className="text-sm text-navy-950/50 mt-0.5">
                        Kelola daftar link microsite publik di <code className="bg-paper-100 px-1.5 py-0.5 rounded text-xs">/pesta-koja</code>
                    </p>
                </div>
                <Link href="/admin/pesta-koja/tambah" className="inline-flex items-center gap-1.5 bg-navy-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors">
                    <Plus className="w-4 h-4" /> Tambah Link
                </Link>
            </div>

            <Card>
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-navy-950/50 text-left">
                            <th className="pb-3 font-medium w-24">Urutan</th>
                            <th className="pb-3 font-medium">Link</th>
                            <th className="pb-3 font-medium">Status</th>
                            <th className="pb-3 font-medium">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {links.length > 0 ? links.map((link, i) => {
                            const Icon = getPestaKojaIcon(link.ikon);
                            return (
                                <tr key={link.id} className="hover:bg-paper-50">
                                    <td className="py-3">
                                        <UrutanButtons id={link.id} bisaNaik={i > 0} bisaTurun={i < links.length - 1} />
                                    </td>
                                    <td className="py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-navy-700/10 text-navy-700 flex items-center justify-center shrink-0">
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-medium text-navy-950 truncate max-w-xs">{link.judul}</div>
                                                <div className="text-xs text-navy-950/40 truncate max-w-xs">{link.url}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3">
                                        <ToggleAktif id={link.id} isAktif={link.is_aktif} />
                                    </td>
                                    <td className="py-3">
                                        <div className="flex items-center gap-3">
                                            <Link href={`/admin/pesta-koja/${link.id}/edit`} className="text-xs text-azure-500 hover:underline font-medium">Edit</Link>
                                            <HapusLinkButton id={link.id} judul={link.judul} />
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : <tr><td colSpan={4} className="py-10 text-center text-navy-950/30">Belum ada link. Klik &quot;Tambah Link&quot; untuk mulai.</td></tr>}
                    </tbody>
                </table>
                </div>
            </Card>
        </>
    );
}
