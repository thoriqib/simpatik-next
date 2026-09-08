/**
 * Spinner loading bersama — dipakai lewat konvensi file `loading.tsx`
 * Next.js App Router. File ini otomatis dibungkus React Suspense oleh
 * Next.js di tiap batas route segment, jadi tampil SEKETIKA begitu
 * navigasi dimulai (bukan menunggu data selesai dimuat) — mengisi jeda
 * antara klik menu dan halaman baru benar-benar berpindah.
 */
export function LoadingSpinner({ label = 'Memuat...' }: { label?: string }) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
            <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border-[3px] border-paper-200" />
                <div className="absolute inset-0 rounded-full border-[3px] border-azure-500 border-t-transparent animate-spin" />
            </div>
            <p className="text-sm text-navy-950/40">{label}</p>
        </div>
    );
}
