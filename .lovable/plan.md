# Rencana Perombakan Website Kelas

Tiga pekerjaan terpisah: (1) update data jadwal, (2) sistem multi-tema dengan 2 skin baru, (3) onboarding guided tour.

## 1. Update Jadwal Kuliah

Mengganti seluruh isi tabel `jadwal` di database dengan 9 entri baru sesuai brief (Senin 3, Selasa 1, Kamis 3, Jumat 2). Dijalankan via satu migration: `DELETE FROM jadwal; INSERT ...` — jadi data lama yang sudah dipakai untuk testing terhapus bersih.

Catatan: kolom `dosen` mungkin belum ada di skema `jadwal` saat ini (kolom existing: matkul, hari, jam_mulai, jam_selesai, ruangan). Jika belum ada, migration menambahkan kolom `dosen TEXT` dulu, lalu UI di `almanak.tsx` dan `_authenticated/index.tsx` (Jadwal Hari Ini) menampilkan nama dosen di samping ruangan.

## 2. Dua Tema Tampilan (Cyber Orange & Cinematic Dark)

Saat ini website pakai 1 tema "JERUK'S EMPIRE" (cream + orange) yang di-hardcode di `:root` pada `src/styles.css`. Akan ditambahkan dua tema baru sebagai class pada `<html>`:

- `.theme-empire` (default existing — tetap)
- `.theme-cyber` — Cyber Orange (dark + glow orange, palette persis dari brief)
- `.theme-cinematic` — Cinematic Dark (Netflix style, palette persis dari brief)

Pendekatan teknis:
- Refactor `src/styles.css`: pindahkan semua token warna dari `:root` ke `.theme-empire`, lalu tambahkan blok `.theme-cyber` dan `.theme-cinematic` yang men-override token yang sama (`--background`, `--foreground`, `--card`, `--primary`, `--border`, `--empire-orange`, dll). Token shadcn semua sudah pakai variabel — jadi cukup ganti variabelnya, komponen otomatis ikut.
- Tambah font Inter (sudah cocok untuk dua-duanya) via `@fontsource/inter`, dan untuk Cinematic pakai font sans-serif system stack sebagai fallback Netflix Sans.
- Buat `ThemeProvider` di `src/lib/theme-context.tsx`: simpan pilihan di `localStorage`, set class di `document.documentElement`, expose `useTheme()`.
- Mount provider di `__root.tsx`.
- Tambah `ThemeSwitcher` (dropdown 3 opsi) di topbar `AppShell.tsx`.
- Untuk tema Cyber Orange: tambahkan utility class `.cyber-glow` (radial gradient blob di background body) dan `.cyber-gradient-text` untuk heading.
- Untuk Cinematic: override border-radius scale agar lebih kotak (radius-sm 2px dst).

Halaman PendingScreen & Auth tetap ikut tema aktif karena pakai token semantic.

## 3. Onboarding Guided Tour

Pakai **Shepherd.js** (lebih modern, dukung styling custom yang cocok ke design system kita; Intro.js stylenya kaku).

- `bun add shepherd.js`
- Buat `src/lib/onboarding-tour.ts`: fungsi `startTour()` yang membuat instance Shepherd dengan 3 langkah:
  1. Highlight link "Almanak" di sidebar → pesan jadwal
  2. Highlight tombol ThemeSwitcher → pesan ganti tema
  3. Highlight area navigasi (sidebar list) → pesan eksplor menu lain
- Tambah `data-tour="jadwal"`, `data-tour="theme"`, `data-tour="nav"` ke elemen target di `AppShell.tsx`.
- Auto-trigger sekali: di `_authenticated/route.tsx`, setelah `hasMember=true`, cek `localStorage.getItem('tour-completed')`. Jika belum, panggil `startTour()` (debounce 600ms biar layout settle).
- Tombol bantuan: tambah `HelpCircle` icon di topbar `AppShell` → klik = `startTour()` lagi (tidak menghapus flag, hanya menjalankan ulang).
- Tombol "Lewati Panduan" sudah built-in di Shepherd via `cancelIcon: true` + button "Lewati".
- Import CSS Shepherd di `styles.css`, lalu override `.shepherd-element` agar pakai token `--card`, `--foreground`, `--primary` supaya ikut tema aktif.

## File yang akan dibuat/diubah

**Created:**
- `supabase/migrations/<ts>_update_jadwal.sql` — reset + insert jadwal baru, tambah kolom `dosen`
- `src/lib/theme-context.tsx` — ThemeProvider + useTheme
- `src/components/empire/ThemeSwitcher.tsx` — dropdown 3 tema
- `src/lib/onboarding-tour.ts` — Shepherd tour definition

**Edited:**
- `src/styles.css` — refactor tema, tambah `.theme-cyber` & `.theme-cinematic`, import Shepherd CSS + override
- `src/routes/__root.tsx` — wrap ThemeProvider
- `src/components/empire/AppShell.tsx` — tambah ThemeSwitcher + Help icon + `data-tour` attributes
- `src/routes/_authenticated/route.tsx` — auto-trigger tour pertama kali
- `src/routes/_authenticated/almanak.tsx` — tampilkan kolom dosen
- `src/routes/_authenticated/index.tsx` (Beranda) — tampilkan dosen di "Jadwal Hari Ini"
- `src/integrations/supabase/types.ts` akan auto-regenerate setelah migration

**Packages:** `bun add shepherd.js @fontsource/inter`

## Catatan teknis

- Tema dipilih per-user via `localStorage` (bukan per-account di DB) supaya cepat & tanpa schema baru. Bila nanti mau sync antar device, baru tambah ke tabel `anggota`.
- Migration jadwal pakai `DELETE` — data testing existing akan hilang. Beritahu kalau perlu preserve, baru kita ubah jadi upsert.
- Shepherd tour hanya jalan di route `_authenticated` (setelah login + verified member), tidak muncul di `/auth` atau pending screen.

Lanjut implement?
