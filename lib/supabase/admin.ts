import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client dengan SERVICE ROLE KEY — bypass RLS sepenuhnya.
 * HANYA dipakai di Server Action tertentu yang butuh hak admin penuh,
 * misal membuat akun petugas baru lewat Supabase Auth Admin API.
 * JANGAN PERNAH diimpor di client component.
 */
export function createAdminClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}
