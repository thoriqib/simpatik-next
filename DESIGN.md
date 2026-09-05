# 🎨 Sistem Desain — Simpatik

Dokumen ini menjelaskan keputusan desain di balik tampilan Simpatik versi
Next.js, agar konsisten saat menambah halaman/fitur baru.

---

## Filosofi

Simpatik adalah aplikasi **statistik** — identitas visualnya harus terasa
seperti alat kerja yang presisi dan bisa dipercaya, bukan sekadar "portal
pemerintah biru generik". Dua ide yang mendasari semua keputusan:

1. **Angka adalah warga kelas satu.** Kode antrian, jam presensi, statistik
   laporan — semua pakai font monospace dengan angka tabular (`.tabular`),
   supaya sejajar rapi dan mudah dipindai/dibandingkan. Ini bukan gaya,
   tapi fungsi: di aplikasi data, keterbacaan angka itu prioritas.
2. **Tekstur kertas grafik sebagai signature.** Dipakai terbatas di 2 tempat
   saja — halaman login dan nomor antrian besar di tiket — sebagai referensi
   visual ke "kertas data/statistik" tanpa jadi dekorasi berlebihan.

---

## Token Warna

Didefinisikan di `tailwind.config.ts`:

| Token | Hex | Dipakai untuk |
|-------|-----|----------------|
| `navy-950` | `#0B1A2E` | Sidebar, background gelap, teks utama (via opacity: `text-navy-950/60` dst) |
| `navy-700` | `#1B3A5F` | Warna brand utama — tombol primer, aksen |
| `azure-500` | `#3B82C4` | Interaktif: link, focus ring, status "dipanggil/izin" |
| `amber-500` | `#E2984D` | Aksen hangat: highlight, status "menunggu", tombol presensi keluar |
| `paper-50/100/200` | `#F8F7F4` dst | Background hangat & border — pengganti abu-abu dingin generik |

**Pola opacity untuk teks**: alih-alih banyak shade abu-abu (`text-gray-400`,
`text-gray-500`, `text-gray-600`...), dipakai satu warna `navy-950` dengan
variasi opacity (`/80`, `/60`, `/50`, `/30`) — lebih konsisten dan gampang
diatur.

---

## Tipografi

Diatur lewat `next/font/google` di `app/layout.tsx`:

- **Plus Jakarta Sans** (`--font-jakarta`) — dipakai untuk semua UI & body text. Geometris, punya karakter, dan namanya sendiri beresonansi dengan konteks aplikasi pemerintah Indonesia.
- **IBM Plex Mono** (`--font-plex-mono`) — khusus untuk data numerik: kode antrian, jam, angka statistik. Class `font-mono` + `.tabular` (didefinisikan di `globals.css`) dipakai bersamaan.

---

## Komponen Inti (`components/ui/`)

Semua halaman lain memakai komponen ini — ubah di satu tempat, konsisten
di seluruh aplikasi:

- **`Card`** — kontainer utama (`shadow-soft`, `rounded-2xl`, border `paper-200`)
- **`Badge`** — status pill dengan warna semantik per status (lihat `Badge.tsx`)
- **`SubmitButton`** — tombol form dengan loading spinner otomatis dari `useFormStatus()`
- **`FormInput`** — input dengan label & error state konsisten
- **`Modal` / `ConfirmModal`** — dialog dengan backdrop blur

---

## Layout & Responsivitas

- **Admin/Petugas**: sidebar `fixed` selebar `w-64`, di mobile (`<lg`) berubah
  jadi *off-canvas drawer* yang di-toggle lewat tombol hamburger di
  `AdminShell.tsx`/`PetugasShell.tsx`. Konten pakai `lg:ml-64` agar
  otomatis menyesuaikan.
- **Publik**: layout satu kolom max-width `2xl` (672px), nyaman dibaca di
  HP tanpa terasa kosong di desktop.
- Breakpoint yang dipakai konsisten: `sm:` (≥640px) dan `lg:` (≥1024px) —
  cukup 2 breakpoint untuk aplikasi internal seperti ini, tidak perlu lebih.

---

## Aksesibilitas

- `:focus-visible` global di `globals.css` — outline 2px `azure-500`,
  terlihat jelas untuk navigasi keyboard, tidak mengganggu saat pakai mouse
- `prefers-reduced-motion` dihormati — animasi otomatis dipangkas untuk
  pengguna yang mengaktifkan setting ini di OS mereka
- Kontras warna teks terhadap background sudah dijaga lewat skala opacity
  `navy-950` yang tidak turun di bawah `/30` untuk teks yang perlu terbaca

---

## Menambah Halaman Baru

1. Pakai `<Card>`, `<Badge>`, `<SubmitButton>`, `<FormInput>` dari
   `components/ui/` — jangan tulis ulang style card/badge/button manual
2. Untuk angka (kode, jam, statistik): `className="font-mono tabular"`
3. Warna teks: pakai `text-navy-950` + opacity (`/80`, `/60`, `/50`, `/30`),
   bukan `text-gray-*`
4. Warna brand: `bg-navy-700` (tombol primer), `text-azure-500` (link),
   `bg-amber-500` (highlight/warning)
5. Border & background netral: `border-paper-200`, `bg-paper-50`/`bg-paper-100`
6. Radius: `rounded-xl` untuk kartu/tombol/input, `rounded-2xl` untuk
   kontainer besar, `rounded-full` untuk badge/avatar

---

*Simpatik — BPS Kota Jambi*
*Sistem Desain v1.0 — April 2026*
