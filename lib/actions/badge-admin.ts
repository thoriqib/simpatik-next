'use server';

import { createClient } from '@/lib/supabase/server';

export type BadgeAdmin = { permintaanBaru: number; gantiJadwal: number };

/**
 * Angka lencana sidebar admin: permintaan data berstatus 'baru' dan request ganti jadwal
 * berstatus 'menunggu' (belum diputuskan). Bukan admin → 0 semua.
 */
export async function hitungBadgeAdmin(): Promise<BadgeAdmin> {
    const kosong = { permintaanBaru: 0, gantiJadwal: 0 };
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return kosong;
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return kosong;

    const [a, b] = await Promise.all([
        supabase.from('permintaan_data').select('id', { count: 'exact', head: true }).eq('status', 'baru'),
        supabase.from('request_ganti_jadwal').select('id', { count: 'exact', head: true }).eq('status', 'menunggu'),
    ]);
    return { permintaanBaru: a.count ?? 0, gantiJadwal: b.count ?? 0 };
}
