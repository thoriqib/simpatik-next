import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Ambil nama (HANYA id & name) beberapa petugas, lewat service role.
 *
 * Tabel profiles dilindungi RLS (petugas hanya boleh membaca profilnya sendiri; email/no. HP rekan
 * tidak boleh terbuka), sehingga join `profiles(name)` dari sisi petugas selalu kosong untuk rekan
 * lain. Fungsi ini hanya untuk Server Component/Action yang sudah memverifikasi pemanggil adalah
 * petugas/admin, dan HANYA mengembalikan nama.
 */
export async function ambilNamaPetugas(ids: (string | null | undefined)[]): Promise<Map<string, string>> {
    const unik = [...new Set(ids.filter((x): x is string => !!x))];
    const peta = new Map<string, string>();
    if (unik.length === 0) return peta;
    const { data } = await createAdminClient().from('profiles').select('id, name').in('id', unik);
    for (const r of data ?? []) peta.set(r.id as string, r.name as string);
    return peta;
}
