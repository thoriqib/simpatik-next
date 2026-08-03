import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Supabase client untuk dipakai di Server Component & Server Action.
 * Membaca/menulis cookie sesi lewat next/headers.
 */
export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Diabaikan jika dipanggil dari Server Component (bukan Action/Route Handler)
                        // — middleware yang akan menangani refresh sesi.
                    }
                },
            },
        }
    );
}
