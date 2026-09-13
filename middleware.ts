import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Middleware ini menggantikan peran `role:admin` / `role:petugas`
 * middleware di Laravel. Dijalankan di setiap request untuk:
 * 1. Refresh sesi Supabase (wajib di Next.js App Router)
 * 2. Redirect ke /login jika mengakses /admin atau /petugas tanpa sesi
 * 3. Redirect ke dashboard yang sesuai jika role tidak cocok dengan area yang diakses
 * 4. Redirect user yang sudah login menjauh dari halaman /login
 *
 * [FITUR BARU] Ditambah locale routing (next-intl) — TAPI HANYA untuk
 * rute publik yang masuk scope terjemahan (landing, antrian, permintaan-
 * data, pengaduan, penilaian, faq, pesta-koja). Rute admin/petugas/login/
 * display-antrian/jadwal-petugas SENGAJA dilewati sepenuhnya dari logic
 * locale — tetap berjalan identik seperti sebelum fitur ini ada, nol
 * risiko ke logic auth yang sudah terbukti stabil.
 */
export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const isAdminRoute = path.startsWith('/admin');
    const isPetugasRoute = path.startsWith('/petugas');
    const isLoginRoute = path === '/login';
    const isDisplayAntrianRoute = path.startsWith('/display-antrian');
    const isJadwalPetugasRoute = path.startsWith('/jadwal-petugas');

    // Rute yang TIDAK ikut scope terjemahan — lewati next-intl middleware
    // sepenuhnya, langsung ke logic auth seperti semula (tidak berubah).
    const lewatiIntl = isAdminRoute || isPetugasRoute || isLoginRoute || isDisplayAntrianRoute || isJadwalPetugasRoute;

    let response = lewatiIntl ? NextResponse.next({ request }) : intlMiddleware(request);

    // [FIX KRITIS] Supabase membaca `response` dari next-intl di atas dan
    // MENAMBAHKAN cookie langsung ke objek yang sama — TIDAK PERNAH
    // reassign `response` ke objek baru di sini. Kalau di-reassign
    // (seperti pola lama sebelum ada next-intl), redirect/rewrite locale
    // yang sudah disiapkan next-intl di atas akan hilang/tertimpa. Ini
    // pola yang dikonfirmasi benar dari diskusi resmi next-intl & Supabase
    // soal cara menggabung middleware keduanya.
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Belum login tapi mengakses area terproteksi → redirect ke /login
    if (!user && (isAdminRoute || isPetugasRoute)) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', path);
        return NextResponse.redirect(url);
    }

    // Sudah login → cek role untuk proteksi area & redirect halaman login
    if (user && (isAdminRoute || isPetugasRoute || isLoginRoute)) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const role = profile?.role;

        if (isLoginRoute) {
            const url = request.nextUrl.clone();
            url.pathname = role === 'admin' ? '/admin/dashboard' : '/petugas/dashboard';
            return NextResponse.redirect(url);
        }

        if (isAdminRoute && role !== 'admin') {
            const url = request.nextUrl.clone();
            url.pathname = role === 'petugas' ? '/petugas/dashboard' : '/login';
            return NextResponse.redirect(url);
        }

        // [UPDATE] Admin boleh MERANGKAP sebagai petugas — bisa mengakses
        // seluruh fitur petugas (presensi, layani antrian, tangani
        // permintaan data) selain fitur admin-nya sendiri. RLS di tabel
        // terkait (antrian, permintaan_data, presensi) memang sudah
        // mengizinkan ini di level data — middleware ini yang sebelumnya
        // jadi satu-satunya penghalang murni di level rute.
        if (isPetugasRoute && role !== 'petugas' && role !== 'admin') {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
