# MBG Menu — Paket Produksi

## Fitur
- Website publik: `/`
- Admin login: `/admin`
- Supabase Auth + Postgres
- Data menu per tanggal
- Rincian energi, protein, lemak, karbohidrat
- Persentase AKG
- Status draft/publik
- Satu QR permanen dapat diarahkan ke website utama
- Struktur siap dikembangkan untuk upload foto menu

## Setup
1. Buat project Supabase.
2. Buka SQL Editor dan jalankan `supabase/schema.sql`, lalu `supabase/seed.sql`.
3. Buat akun admin di Supabase Authentication > Users.
4. Salin `.env.example` menjadi `.env` dan isi URL + publishable key project.
5. Jalankan:
   npm install
   npm run dev
6. Build produksi:
   npm run build

## QR
QR cukup mengarah ke URL website publik, misalnya:
https://domain-kamu.id/
Karena tanggal dipilih di halaman, QR tidak perlu diganti setiap hari.

## Keamanan
Publishable key boleh dipakai di browser. Jangan pernah memasukkan service-role/secret key ke frontend. RLS pada database harus tetap aktif.
