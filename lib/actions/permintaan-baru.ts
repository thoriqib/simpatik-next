'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Jumlah permintaan data yang masih berstatus 'baru' (belum ada petugas yang menangani).
 * Dipakai untuk lencana angka di sidebar menu "Permintaan Data". Hanya admin/petugas yang boleh
 * melihat; selain itu mengembalikan 0.
 */
export async function hitungPermintaanBaru(): Promise<number> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count } = await supabase
        .from('permintaan_data')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'baru');
    return count ?? 0;
}
