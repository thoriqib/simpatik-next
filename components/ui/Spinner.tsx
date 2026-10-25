import { Loader2 } from 'lucide-react';

/** Spinner kecil serbaguna untuk tombol/aksi — ikut warna teks (currentColor). */
export function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
    return <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />;
}
