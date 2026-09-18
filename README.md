# Candipuro AI

## Deskripsi Singkat
Candipuro AI adalah asisten kecerdasan buatan berbasis web yang dirancang untuk menyediakan informasi komprehensif secara akurat dan objektif. Sistem ini mampu menangani berbagai topik, mulai dari akademis, ilmu pengetahuan, hingga pemrograman, dengan antarmuka yang modern dan responsif.

## Fitur Utama

- **Pusat Pengetahuan Komprehensif:** Mampu menjawab berbagai pertanyaan kompleks dengan penjelasan yang terstruktur, termasuk penulisan kode pemrograman dan penjabaran konsep matematis.
- **Antarmuka Premium (Glassmorphism):** Desain antarmuka modern yang mengutamakan estetika dan kenyamanan pengguna dengan dukungan mode gelap yang elegan.
- **Sinkronisasi Data Real-Time:** Dengan dukungan arsitektur awan (Firebase), seluruh riwayat percakapan disinkronisasikan secara instan antar perangkat ketika pengguna masuk (login) ke dalam akun.
- **Manajemen Sesi dan Privasi:** Tersedia mode tamu untuk percakapan tanpa riwayat permanen, serta mode terautentikasi untuk menyimpan jejak obrolan di dalam basis data.
- **Sistem Kuota Terintegrasi:** Dilengkapi dengan manajemen batas penggunaan (Rate Limiting) yang terikat pada IP dan UID, serta diperbarui otomatis secara berkala untuk mencegah penyalahgunaan lalu lintas data.
- **Pengarsipan Percakapan (Pin):** Pengguna dapat menyematkan percakapan penting agar selalu menempati urutan teratas pada panel navigasi.
- **Dukungan Format Markdown:** Hasil keluaran sistem kecerdasan buatan diproses menggunakan standar Markdown penuh, yang memungkinkan pe-renderan blok kode (Syntax Highlighting), tabel, dan persamaan matematis (KaTeX).

## Spesifikasi Teknis

Sistem ini dikembangkan dengan susunan teknologi (Tech Stack) modern untuk menjamin keandalan, keamanan, dan skalabilitas:

- **Kerangka Kerja (Framework):** Next.js 15 (App Router), React
- **Antarmuka Pengguna (UI):** Tailwind CSS, Shadcn UI
- **Mesin Kecerdasan Buatan:** OpenAI API (dengan Model Terstruktur / Structured Outputs)
- **Basis Data dan Autentikasi:** Firebase Authentication (Google, Email, Nomor Telepon), Cloud Firestore
- **Validasi Data:** Zod

## Panduan Instalasi dan Pengembangan

Ikuti langkah-langkah berikut untuk menjalankan Candipuro AI di lingkungan pengembangan lokal Anda:

1. Kloning repositori ini ke penyimpanan lokal Anda.
2. Buka terminal pada direktori proyek, lalu jalankan perintah instalasi pustaka dependensi:
   ```bash
   npm install
   ```
3. Proyek ini menyertakan berkas `.env.example`. Gandakan (copy) berkas tersebut dan ubah namanya menjadi `.env.local`, lalu isi dengan kredensial API Anda:
   ```bash
   cp .env.example .env.local
   ```
   *Penting: Jaga kerahasiaan berkas `.env.local` Anda. Jangan pernah mengunggah atau membagikan `OPENAI_API_KEY` Anda ke publik.*

4. Konfigurasi kredensial pada `.env.local`:
   ```env
   OPENAI_API_KEY="sk-proj-..."
   NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
   ...
   ```
4. Mulai server pengembangan lokal:
   ```bash
   npm run dev
   ```
5. Akses aplikasi melalui peramban web pada tautan: `http://localhost:9002`
