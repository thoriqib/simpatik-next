import { format, parseISO, differenceInMinutes } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

const TZ = 'Asia/Jakarta';

/** Tanggal & jam sekarang di WIB (GMT+7), pengganti now()/today() Laravel */
export function nowWIB(): Date {
    return toZonedTime(new Date(), TZ);
}

export function todayDateStringWIB(): string {
    return formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd');
}

export function formatTanggal(dateStr: string, fmt = 'EEEE, d MMMM yyyy'): string {
    return format(parseISO(dateStr), fmt, { locale: localeId });
}

export function formatJam(dateStr: string | null): string {
    if (!dateStr) return '-';
    return formatInTimeZone(dateStr, TZ, 'HH:mm');
}

export function formatDurasi(menit: number): string {
    const jam = Math.floor(menit / 60);
    const sisaMenit = menit % 60;
    return [jam > 0 ? `${jam}j` : '', sisaMenit > 0 ? `${sisaMenit}m` : ''].filter(Boolean).join(' ') || '0m';
}

/** Hitung selisih menit antara dua waktu ISO string */
export function diffMenit(mulai: string, selesai: string): number {
    return differenceInMinutes(parseISO(selesai), parseISO(mulai));
}

/** Label status dalam Bahasa Indonesia + warna badge Tailwind */
export const STATUS_BADGE: Record<string, { label: string; className: string }> = {
    menunggu:  { label: 'Menunggu',  className: 'bg-yellow-100 text-yellow-700' },
    dipanggil: { label: 'Dipanggil', className: 'bg-blue-100 text-blue-700' },
    dilayani:  { label: 'Dilayani',  className: 'bg-purple-100 text-purple-700' },
    selesai:   { label: 'Selesai',   className: 'bg-green-100 text-green-700' },
    batal:     { label: 'Batal',     className: 'bg-gray-100 text-gray-500' },
    baru:      { label: 'Baru',      className: 'bg-red-100 text-red-700' },
    diproses:  { label: 'Diproses',  className: 'bg-yellow-100 text-yellow-700' },
    hadir:     { label: 'Hadir',     className: 'bg-green-100 text-green-700' },
    izin:      { label: 'Izin',      className: 'bg-blue-100 text-blue-700' },
    sakit:     { label: 'Sakit',     className: 'bg-orange-100 text-orange-700' },
    alpha:     { label: 'Alpha',     className: 'bg-red-100 text-red-700' },
    terjadwal: { label: 'Terjadwal', className: 'bg-gray-100 text-gray-600' },
};

// ═══════════════════════════════════════════════════════════════
// Helper minggu kerja (Senin–Jumat) — dipakai oleh halaman jadwal
// petugas (publik & admin) untuk navigasi per minggu.
// ═══════════════════════════════════════════════════════════════

/** Ambil tanggal Senin dari minggu yang memuat `date` (format YYYY-MM-DD lokal, bukan UTC). */
export function getMondayOfWeek(date: Date): Date {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
    const diff = day === 0 ? -6 : 1 - day; // mundur ke Senin terdekat
    d.setDate(d.getDate() + diff);
    return d;
}

/** Format Date lokal (bukan UTC) jadi string YYYY-MM-DD — aman dari pergeseran zona waktu toISOString(). */
export function toDateStringLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/** Bangun 5 tanggal Senin–Jumat dari sebuah tanggal Senin. */
export function getWeekdayDates(monday: Date): Date[] {
    return Array.from({ length: 5 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(d.getDate() + i);
        return d;
    });
}

/** Senin minggu ini, berbasis tanggal WIB hari ini. */
export function currentWeekMondayWIB(): Date {
    const todayStr = todayDateStringWIB(); // "YYYY-MM-DD"
    const [y, m, d] = todayStr.split('-').map(Number);
    return getMondayOfWeek(new Date(y, m - 1, d));
}

/** Parse string "YYYY-MM-DD" jadi Date lokal (bukan UTC) — hindari pergeseran tanggal. */
export function parseDateLocal(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}
