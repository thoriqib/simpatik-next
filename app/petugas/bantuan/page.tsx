import { BantuanStafContent } from '@/components/BantuanStafContent';
import { HelpCircle } from 'lucide-react';

export default function BantuanPetugasPage() {
    return (
        <>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-azure-500/10 text-azure-500 flex items-center justify-center shrink-0">
                    <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-lg font-semibold text-navy-950">Bantuan Penggunaan</h1>
                    <p className="text-sm text-navy-950/50">Panduan singkat fitur Simpatik untuk petugas</p>
                </div>
            </div>
            <BantuanStafContent peran="petugas" />
        </>
    );
}
