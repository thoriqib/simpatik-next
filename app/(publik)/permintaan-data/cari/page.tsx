import { CariForm } from './CariForm';
import Link from 'next/link';

export default function CariPermintaanDataPage() {
    return (
        <>
            <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-navy-950 tracking-tight">Cari Permintaan Data Saya</h1>
                <p className="text-sm text-navy-950/50 mt-1 max-w-sm mx-auto">
                    Lupa menyimpan link lacak? Masukkan email dan tanggal Anda mengajukan
                    permintaan, kami bantu carikan.
                </p>
            </div>

            <CariForm />

            <div className="mt-4 text-center">
                <Link href="/permintaan-data" className="text-sm text-navy-950/50 hover:underline">← Kembali ke Form Permintaan Data</Link>
            </div>
        </>
    );
}
