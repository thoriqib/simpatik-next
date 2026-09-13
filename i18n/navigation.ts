import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/**
 * Helper navigasi yang locale-aware — dipakai HANYA di halaman publik
 * yang masuk scope terjemahan. Halaman admin/petugas tetap pakai
 * `next/link` & `next/navigation` biasa (tidak perlu locale-aware,
 * karena memang tidak ikut diterjemahkan).
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
