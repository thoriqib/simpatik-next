'use client';

import { Printer } from 'lucide-react';

/**
 * Tombol cetak tiket antrian. Memakai window.print() browser bawaan —
 * styling area yang boleh tercetak diatur lewat class Tailwind `print:`
 * di halaman tiket (lihat page.tsx), supaya yang tercetak hanya kartu
 * tiketnya saja, bukan latar navy gelap atau tombol-tombol aksi.
 */
export function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 bg-white text-navy-950 px-5 py-3 rounded-full font-medium shadow-card hover:bg-paper-50 transition-colors text-sm"
        >
            <Printer className="w-3.5 h-3.5" />
            Cetak Tiket
        </button>
    );
}
