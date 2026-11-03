-- Hapus kartu "Pengaduan & Whistleblowing System" dari halaman Pesta Koja.
-- Jalankan di Supabase SQL Editor. (Kartu ini juga bisa dihapus manual lewat Admin → Pesta Koja.)
delete from public.pesta_koja_link
where judul = 'Pengaduan & Whistleblowing System';
