'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export type ActionState = { error?: string } | null;

/** Login — dipakai oleh form di app/login/page.tsx */
export async function login(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return { error: 'Email atau password salah.' };
    }

    // Ambil role untuk redirect yang sesuai (setara AuthenticatedSessionController Laravel)
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

    revalidatePath('/', 'layout');

    if (profile?.role === 'admin') redirect('/admin/dashboard');
    if (profile?.role === 'petugas') redirect('/petugas/dashboard');

    // Fallback: role tidak valid → paksa logout
    await supabase.auth.signOut();
    return { error: 'Akun Anda tidak memiliki akses ke sistem ini.' };
}

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath('/', 'layout');
    redirect('/login');
}

/**
 * Admin membuat akun petugas baru — setara Admin/PetugasController@store Laravel.
 * Memakai Service Role Key (bypass RLS) karena Supabase Auth signup normal
 * butuh sesi user itu sendiri, sedangkan ini dibuat OLEH admin UNTUK petugas.
 */
export async function createPetugasAccount(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (password.length < 8) {
        return { error: 'Password minimal 8 karakter.' };
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role: 'petugas' },
    });

    if (error) {
        return { error: error.message.includes('already registered') ? 'Email sudah terdaftar.' : error.message };
    }

    revalidatePath('/admin/petugas');
    redirect('/admin/petugas');
}

export async function updatePetugasAccount(userId: string, prevState: ActionState, formData: FormData): Promise<ActionState> {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Update profile (nama)
    const { error: profileError } = await supabase.from('profiles').update({ name, email }).eq('id', userId);
    if (profileError) return { error: profileError.message };

    // Update auth.users (email & password jika diisi)
    const updates: { email?: string; password?: string } = { email };
    if (password && password.length >= 8) updates.password = password;

    const { error: authError } = await adminClient.auth.admin.updateUserById(userId, updates);
    if (authError) return { error: authError.message };

    revalidatePath('/admin/petugas');
    redirect('/admin/petugas');
}

export async function deletePetugasAccount(userId: string) {
    const adminClient = createAdminClient();
    await adminClient.auth.admin.deleteUser(userId); // profiles ikut terhapus via ON DELETE CASCADE
    revalidatePath('/admin/petugas');
}

/**
 * Ubah role seorang pengguna antara 'admin' dan 'petugas'. Dipakai admin
 * untuk menjadikan petugas tertentu sebagai admin (atau sebaliknya).
 *
 * Proteksi: tidak boleh menurunkan admin TERAKHIR yang tersisa — supaya
 * tidak ada skenario semua akun kehilangan akses admin sekaligus (terkunci
 * dari fitur admin selamanya, cuma bisa diperbaiki manual lewat SQL).
 */
export async function ubahRolePengguna(userId: string, roleBaru: 'admin' | 'petugas') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Sesi tidak valid, silakan login ulang.' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return { error: 'Hanya admin yang bisa mengubah role pengguna.' };

    if (roleBaru === 'petugas') {
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin');
        const { data: target } = await supabase.from('profiles').select('role').eq('id', userId).single();
        if (target?.role === 'admin' && (count ?? 0) <= 1) {
            return { error: 'Tidak bisa menurunkan admin terakhir. Jadikan admin lain dulu sebelum menurunkan akun ini.' };
        }
    }

    const { error } = await supabase.from('profiles').update({ role: roleBaru }).eq('id', userId);
    if (error) return { error: error.message };

    revalidatePath('/admin/petugas');
    revalidatePath('/admin/pengaturan-akses');
    return { success: true };
}

/**
 * Import massal akun petugas dari CSV (kolom: nama, email, password_opsional).
 * Password bersifat opsional per baris — jika kosong, dipakai password
 * default yang seragam (petugas WAJIB mengganti setelah login pertama).
 * Setiap baris dibuat lewat Supabase Auth Admin API satu per satu (bukan
 * batch) karena Supabase tidak menyediakan endpoint create-user massal.
 */
const DEFAULT_IMPORT_PASSWORD = 'Petugas@BPS2026';

export async function importPetugasCSV(rows: { nama: string; email: string; password?: string }[]) {
    const adminClient = createAdminClient();

    let imported = 0;
    const errors: string[] = [];

    for (const [i, row] of rows.entries()) {
        const rowNum = i + 2; // +1 header, +1 index 0-based

        if (!row.nama || !row.email) continue;

        const password = row.password && row.password.length >= 8 ? row.password : DEFAULT_IMPORT_PASSWORD;

        const { error } = await adminClient.auth.admin.createUser({
            email: row.email.trim(),
            password,
            email_confirm: true,
            user_metadata: { name: row.nama.trim(), role: 'petugas' },
        });

        if (error) {
            const pesan = error.message.includes('already registered') || error.status === 422
                ? `email "${row.email}" sudah terdaftar`
                : error.message;
            errors.push(`Baris ${rowNum}: ${pesan}, dilewati.`);
            continue;
        }
        imported++;
    }

    revalidatePath('/admin/petugas');
    return { imported, skipped: rows.length - imported, errors, defaultPassword: DEFAULT_IMPORT_PASSWORD };
}
