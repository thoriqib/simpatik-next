import { CariPengaduanForm } from './CariPengaduanForm';
import Link from 'next/link';

export default function CariPengaduanPage() {
    return (
        <>
            <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-navy-950 tracking-tight">Lacak Pengaduan Saya</h1>
                <p className="text-sm text-navy-950/50 mt-1 max-w-sm mx-auto">
                    Kehilangan link lacak pengaduan Anda? Tempelkan link atau kode token yang
                    diberikan setelah mengirim pengaduan.
                </p>
            </div>

            <CariPengaduanForm />

            <div className="mt-4 text-center">
                <Link href="/pengaduan" className="text-sm text-navy-950/50 hover:underline">← Kembali ke Form Pengaduan</Link>
            </div>
        </>
    );
}
