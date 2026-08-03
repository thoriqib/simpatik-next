'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { nowWIB, todayDateStringWIB } from '@/lib/utils';
import { formatInTimeZone } from 'date-fns-tz';

const TZ = 'Asia/Jakarta';

/**
 * Presensi masuk. Semua perhitungan waktu eksplisit di WIB (Asia/Jakarta)
 * agar tidak terulang bug timezone yang pernah terjadi di versi Laravel
 * (server default UTC menyebabkan jam presensi meleset 7 jam).
 */
export async function presensiMasuk(jadwalPiketId: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Sesi tidak valid, silakan login ulang.' };

    // Cegah presensi masuk ganda
    const { data: existing } = await supabase
        .from('presensi')
        .select('id, waktu_masuk')
        .eq('jadwal_piket_id', jadwalPiketId)
        .maybeSingle();

    if (existing?.waktu_masuk) {
        return { info: 'Anda sudah melakukan presensi masuk hari ini.' };
    }

    const { data: jadwalRaw } = await supabase
        .from('jadwal_piket')
        .select('*, shift_piket(*)')
        .eq('id', jadwalPiketId)
        .single();

    // [FIX] Cast eksplisit — relasi to-one `shift_piket` ditebak sebagai
    // array tanpa generated types.
    const jadwal = jadwalRaw as unknown as { user_id: string; shift_piket: { jam_mulai: string; jam_selesai: string } } | null;

    if (!jadwal || jadwal.user_id !== user.id) {
        return { error: 'Jadwal tidak ditemukan atau bukan milik Anda.' };
    }

    const waktuMasuk = nowWIB();
    const waktuMasukISO = new Date().toISOString(); // simpan UTC di DB, tampilan selalu diformat ke WIB

    if (existing) {
        await supabase.from('presensi').update({ waktu_masuk: waktuMasukISO }).eq('id', existing.id);
    } else {
        await supabase.from('presensi').insert({ user_id: user.id, jadwal_piket_id: jadwalPiketId, waktu_masuk: waktuMasukISO });
    }

    await supabase.from('jadwal_piket').update({ status: 'hadir' }).eq('id', jadwalPiketId);

    // Hitung keterlambatan
    const jamMulaiShift = jadwal.shift_piket.jam_mulai as string; // "08:00:00"
    const [jamH, jamM] = jamMulaiShift.split(':').map(Number);
    const batasWaktu = new Date(waktuMasuk);
    batasWaktu.setHours(jamH, jamM, 0, 0);
    const terlambatMenit = Math.max(0, Math.round((waktuMasuk.getTime() - batasWaktu.getTime()) / 60000));

    revalidatePath('/petugas/dashboard');
    revalidatePath('/petugas/presensi');

    const jamStr = formatInTimeZone(waktuMasukISO, TZ, 'HH:mm');
    if (terlambatMenit > 0) {
        return { warning: `Presensi masuk tercatat pukul ${jamStr} WIB. Anda terlambat ${terlambatMenit} menit.` };
    }
    return { success: `Presensi masuk berhasil dicatat: ${jamStr} WIB.` };
}

export async function presensiKeluar(presensiId: number) {
    const supabase = await createClient();

    const { data: presensi } = await supabase
        .from('presensi')
        .select('*, jadwal_piket(*, shift_piket(*))')
        .eq('id', presensiId)
        .single();

    if (!presensi) return { error: 'Data presensi tidak ditemukan.' };

    const waktuKeluarISO = new Date().toISOString();
    await supabase.from('presensi').update({ waktu_keluar: waktuKeluarISO }).eq('id', presensiId);

    // Hitung kekurangan jam via RPC function (durasi shift - durasi aktual)
    const { data: kekuranganMenit } = await supabase.rpc('hitung_kekurangan_presensi', { p_presensi_id: presensiId });
    await supabase.from('presensi').update({ kekurangan_menit: kekuranganMenit ?? 0 }).eq('id', presensiId);

    revalidatePath('/petugas/dashboard');
    revalidatePath('/petugas/presensi');
    revalidatePath('/admin/laporan/presensi');

    const jamStr = formatInTimeZone(waktuKeluarISO, TZ, 'HH:mm');
    if (kekuranganMenit && kekuranganMenit > 0) {
        const jam = Math.floor(kekuranganMenit / 60);
        const menit = kekuranganMenit % 60;
        const formatKurang = [jam > 0 ? `${jam} jam` : '', menit > 0 ? `${menit} menit` : ''].filter(Boolean).join(' ');
        return { warning: `Presensi keluar tercatat pukul ${jamStr} WIB. Kekurangan jam: ${formatKurang}.` };
    }
    return { success: `Presensi keluar berhasil dicatat: ${jamStr} WIB.` };
}
