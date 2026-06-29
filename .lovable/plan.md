Ini cakupannya besar (4 perbaikan + 7 fitur). Saya pecah jadi 3 sprint supaya bisa dikirim bertahap dan kamu bisa review tiap milestone. Konfirmasi dulu sebelum saya mulai.

## Sprint 1 — Perbaikan & Quick Wins (mulai duluan)

**Keamanan & UX inti:**
1. Proteksi role Para Bangsawan (client guard + server check di `createAnggota`).
2. Edit & hapus tugas (`updateTugas`, `deleteTugas` + tombol di card, hanya Yang Mulia/Sekretaris).
3. Validasi deadline lewat (toast warning + konfirmasi).
4. Upload foto Balai Kenangan ke bucket `kenangan` (sudah ada) — ganti input URL jadi file picker.
5. Dark mode toggle di AppShell (localStorage + class `dark` di root).
6. Grafik kas (BarChart pemasukan vs pengeluaran per bulan di Perbendaharaan).
7. Export PDF kas (jsPDF + autotable, tombol "Unduh Laporan").

## Sprint 2 — Fitur Kolaborasi

8. Halaman Absensi (`/absensi`): tabel `absensi` (anggota_id, matkul, tanggal, status), rekap per matkul, persentase per anggota.
9. Polling/Vote: tabel `polling` + `pilihan_polling` + `vote`, halaman buat/ikut voting, hasil realtime.

## Sprint 3 — Notifikasi (perlu input kamu)

10. **WhatsApp via Fonnte** — perlu kamu daftar di fonnte.com, ambil API token. Cron H-1 deadline kirim ke grup. Saya minta secret-nya saat sprint ini dimulai.
11. **PWA + Push Notif** — manifest, service worker, Web Push (VAPID keys auto-generate). Notif titah baru & deadline mendekat.

## Catatan Teknis

- Sprint 1 butuh 1 migration (RLS check anggota role), 1 bucket policy update, 2 npm packages (`jspdf`, `jspdf-autotable`).
- Sprint 2 butuh 2 migration baru (absensi, polling).
- Sprint 3 butuh secret `FONNTE_TOKEN` + VAPID keypair (auto-generate).
- Semua server fn baru pakai `requireSupabaseAuth` + `has_role` check, bukan client-side saja.

## Pertanyaan sebelum mulai

1. Oke pecah jadi 3 sprint, atau mau urutan lain?
2. Sprint 3 (WhatsApp + Push) — confirm sekarang atau skip dulu sampai Sprint 1 & 2 selesai?
3. Untuk Balai Kenangan: foto lama (yang sudah pakai URL eksternal) dibiarkan atau dihapus?
