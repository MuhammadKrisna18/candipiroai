# SciGenius AI Chat 🚀

*(Scroll down for Indonesian version / Gulir ke bawah untuk versi Bahasa Indonesia)*

---

## 🇺🇸 English Version

### About SciGenius
SciGenius Chat is an AI-powered educational assistant built with modern web technologies (Next.js 15, Tailwind CSS, Firebase). It is specifically tailored to answer complex questions about physics (especially friction mechanics) and general knowledge, with native bilingual support (English & Indonesian).

### Key Features
- **🧠 Specialized Physics AI:** Strictly follows standardized physics formulas, enforcing checks between static and kinetic friction before answering.
- **🔐 Secure Authentication:** Powered by Firebase Authentication. Users can securely create accounts and sign in using their email and password.
- **🕵️ Ephemeral Guest Mode:** Users who haven't logged in can still chat, but their conversations are completely ephemeral and disappear upon refresh to guarantee privacy.
- **🔒 Private Session History:** Logged-in users have their chat histories saved securely on their local device, isolated by their unique Firebase User ID (`uid`).
- **📌 Chat Management:** Easily manage your conversations with the ability to **Pin** up to 5 important chats to the top of your sidebar, or **Delete** unwanted histories instantly.

### Technologies Used
- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS, Shadcn UI (Radix UI)
- **Backend/AI:** Google Genkit, OpenAI API
- **Authentication:** Firebase Auth

### Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Environment Variables:**
   Create a `.env.local` file in the root directory and add the following keys:
   ```env
   OPENAI_API_KEY="your-openai-api-key"
   NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-firebase-auth-domain"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-firebase-project-id"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-firebase-storage-bucket"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-firebase-messaging-sender-id"
   NEXT_PUBLIC_FIREBASE_APP_ID="your-firebase-app-id"
   ```
3. **Run the development server:**
   ```bash
   npm run dev
   ```
4. **Access the app:** Open [http://localhost:9002](http://localhost:9002) in your browser.

---

## 🇮🇩 Versi Bahasa Indonesia

### Tentang SciGenius
SciGenius Chat adalah asisten edukasi berbasis Kecerdasan Buatan (AI) yang dibangun dengan teknologi web modern (Next.js 15, Tailwind CSS, Firebase). Aplikasi ini dirancang secara khusus untuk menjawab pertanyaan rumit seputar fisika (terutama mekanika gaya gesek) serta pengetahuan umum, dengan dukungan penuh untuk bahasa Inggris dan Indonesia.

### Fitur Utama
- **🧠 AI Spesialis Fisika:** AI secara ketat mengikuti standar rumus fisika, selalu memastikan evaluasi gaya gesek statis dan kinetis secara akurat sebelum memberikan jawaban.
- **🔐 Autentikasi Aman:** Ditenagai oleh Firebase Authentication. Pengguna dapat membuat akun dan login secara aman menggunakan email dan kata sandi.
- **🕵️ Mode Tamu Tanpa Jejak:** Pengguna yang belum login tetap dapat menggunakan layanan obrolan, namun riwayat mereka bersifat sementara dan akan lenyap seutuhnya ketika halaman dimuat ulang (*refresh*) demi menjamin privasi.
- **🔒 Riwayat Privat Berbasis Akun:** Pengguna yang telah login memiliki riwayat percakapan yang disimpan secara lokal di perangkat mereka, diisolasi secara khusus menggunakan ID Pengguna (UID) unik dari Firebase.
- **📌 Manajemen Riwayat Obrolan:** Kelola percakapan Anda dengan mudah melalui fitur **Sematkan (Pin)** (maksimal 5 obrolan penting ke bagian atas sidebar), atau **Hapus (Delete)** riwayat yang tidak diinginkan secara instan.

### Teknologi yang Digunakan
- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS, Shadcn UI (Radix UI)
- **Backend/AI:** Google Genkit, OpenAI API
- **Autentikasi:** Firebase Auth

### Cara Memulai

1. **Instal dependensi:**
   ```bash
   npm install
   ```
2. **Variabel Lingkungan (Environment Variables):**
   Buat file bernama `.env.local` di *folder* utama proyek, lalu tambahkan kunci-kunci berikut:
   ```env
   OPENAI_API_KEY="kunci-openai-anda"
   NEXT_PUBLIC_FIREBASE_API_KEY="kunci-api-firebase-anda"
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="domain-auth-firebase-anda"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="id-proyek-firebase-anda"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="bucket-penyimpanan-firebase-anda"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="id-pengirim-pesan-firebase-anda"
   NEXT_PUBLIC_FIREBASE_APP_ID="id-aplikasi-firebase-anda"
   ```
3. **Jalankan *server* lokal:**
   ```bash
   npm run dev
   ```
4. **Buka aplikasi:** Akses [http://localhost:9002](http://localhost:9002) melalui *browser* Anda.
