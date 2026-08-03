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
