import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware ini menggantikan peran `role:admin` / `role:petugas`
 * middleware di Laravel. Dijalankan di setiap request untuk:
 * 1. Refresh sesi Supabase (wajib di Next.js App Router)
 * 2. Redirect ke /login jika mengakses /admin atau /petugas tanpa sesi
 * 3. Redirect ke dashboard yang sesuai jika role tidak cocok dengan area yang diakses
 * 4. Redirect user yang sudah login menjauh dari halaman /login
 */
export async function middleware(request: NextRequest) {
    let response = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    response = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;
    const isAdminRoute = path.startsWith('/admin');
    const isPetugasRoute = path.startsWith('/petugas');
    const isLoginRoute = path === '/login';

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

        if (isPetugasRoute && role !== 'petugas') {
            const url = request.nextUrl.clone();
            url.pathname = role === 'admin' ? '/admin/dashboard' : '/login';
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
