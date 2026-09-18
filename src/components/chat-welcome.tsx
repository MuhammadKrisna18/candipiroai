import React, { useState, useEffect } from "react";
import { UserSession } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Sparkles, LogIn, ChevronRight } from "lucide-react";

interface ChatWelcomeProps {
  user: UserSession;
  handleLogin: () => void;
  setInput: (input: string) => void;
}

const ALL_SUGGESTIONS = [
  "Bantu saya membuat rencana perjalanan wisata ke Gunung Semeru.",
  "Ceritakan sejarah singkat tentang Kecamatan Candipuro.",
  "Tuliskan puisi tentang keindahan alam Lumajang.",
  "Apa saja rekomendasi makanan khas dari Kabupaten Lumajang?",
  "Jelaskan konsep Kecerdasan Buatan (AI) kepada anak usia 5 tahun.",
  "Tuliskan email sopan untuk menolak tawaran pekerjaan.",
  "Apa saja resep sarapan sehat yang bisa dibuat dalam 10 menit?",
  "Bantu saya membuat kode program sederhana menggunakan Python.",
  "Sebutkan wisata air terjun terbaik di sekitar Gunung Semeru.",
  "Bagaimana cara mengatasi rasa malas belajar menurut psikologi?",
  "Buat daftar lagu nostalgia Indonesia era 2000-an yang populer.",
  "Jelaskan teori relativitas Einstein dengan bahasa yang mudah dipahami.",
  "Apa saja mitos dan legenda seputar Gunung Semeru?",
  "Bantu saya membuat rencana keuangan bulanan dengan gaji 5 juta.",
  "Berikan tips lolos wawancara kerja untuk posisi Programmer.",
  "Jelaskan perbedaan antara React dan Next.js secara sederhana.",
  "Bagaimana cara membuat resep Pisang Goreng yang krispi dan tahan lama?",
  "Sebutkan daftar wisata keluarga terbaik di Kabupaten Lumajang.",
  "Tuliskan email permintaan cuti tahunan kepada atasan dengan sopan.",
  "Bantu saya merangkum sejarah kemerdekaan Indonesia dalam 3 paragraf.",
  "Berikan daftar buku motivasi terbaik untuk pengembangan diri.",
  "Jelaskan apa itu Black Hole dan bagaimana cara kerjanya.",
  "Buat tabel perbandingan antara smartphone iOS dan Android.",
  "Sebutkan tips merawat laptop agar tidak cepat panas (Overheat).",
  "Tuliskan naskah pidato singkat tentang pentingnya menjaga lingkungan.",
  "Apa yang menyebabkan terjadinya fenomena El Nino?",
  "Berikan tebak-tebakan logika yang susah ditebak.",
  "Bagaimana strategi jitu mendapatkan beasiswa LPDP untuk kuliah di luar negeri?",
  "Jelaskan metode belajar Pomodoro dan bagaimana menerapkannya.",
  "Apa saja perbedaan kurikulum merdeka dan kurikulum 2013?",
  "Berikan rekomendasi universitas terbaik untuk jurusan Teknik Informatika di Indonesia.",
  "Bagaimana cara mendidik anak agar memiliki kebiasaan membaca sejak dini?",
  "Jelaskan pentingnya pendidikan vokasi di era revolusi industri 4.0.",
  "Apa saja manfaat minum air putih 2 liter sehari bagi tubuh?",
  "Bagaimana cara menjaga kesehatan mental saat beban kerja sedang tinggi?",
  "Sebutkan 5 latihan kardio sederhana yang bisa dilakukan di dalam rumah.",
  "Apa perbedaan antara virus dan bakteri penyebab penyakit?",
  "Jelaskan pentingnya tidur cukup bagi sistem kekebalan tubuh.",
  "Bagaimana cara melakukan pertolongan pertama pada korban luka bakar ringan?",
  "Bantu saya memahami dampak media sosial terhadap pola interaksi remaja.",
  "Bagaimana cara membangun empati dalam komunikasi sehari-hari?",
  "Jelaskan apa yang dimaksud dengan fenomena FOMO (Fear of Missing Out).",
  "Apa dampak kesenjangan sosial terhadap tingkat kriminalitas?",
  "Bagaimana peran generasi muda dalam melestarikan budaya lokal?",
  "Jelaskan pentingnya kegiatan gotong royong di era modern.",
  "Jelaskan perbedaan antara inflasi dan deflasi secara sederhana.",
  "Bagaimana cara memulai investasi reksa dana untuk pemula?",
  "Apa dampak kenaikan harga BBM terhadap harga bahan pokok?",
  "Jelaskan apa yang dimaksud dengan resesi ekonomi global.",
  "Berikan ide bisnis sampingan dengan modal di bawah 1 juta rupiah.",
  "Bagaimana cara membedakan antara kebutuhan dan keinginan dalam mengatur keuangan?",
  "Jelaskan perbedaan sistem pemerintahan presidensial dan parlementer.",
  "Apa saja hak dan kewajiban seorang warga negara Indonesia?",
  "Bagaimana proses lahirnya Pancasila sebagai dasar negara?",
  "Jelaskan apa yang dimaksud dengan asas Pemilu LUBER JURDIL.",
  "Apa peran Dewan Perwakilan Rakyat (DPR) dalam sistem pemerintahan?",
  "Jelaskan dampak korupsi terhadap pembangunan infrastruktur negara.",
  "Ceritakan kisah inspiratif dari salah satu tokoh pahlawan atau nabi.",
  "Jelaskan pentingnya menjaga toleransi antar umat beragama di Indonesia.",
  "Bagaimana pandangan agama tentang menjaga kelestarian lingkungan?",
  "Apa makna spiritual dari kegiatan berpuasa?",
  "Berikan kutipan ayat suci yang memotivasi untuk tidak mudah menyerah.",
  "Jelaskan sejarah singkat masuknya berbagai agama besar ke nusantara.",
  "Tuliskan lirik lagu daerah nusantara beserta maknanya.",
  "Jelaskan apa yang dimaksud dengan kecerdasan buatan generatif (Generative AI).",
  "Bagaimana cara kerja teknologi blockchain dan cryptocurrency?",
  "Berikan rekomendasi film fiksi ilmiah terbaik sepanjang masa.",
  "Buatlah jadwal harian untuk mahasiswa yang juga bekerja paruh waktu.",
  "Apa saja misteri laut dalam yang belum terpecahkan hingga kini?",
  "Jelaskan proses terjadinya gerhana bulan total.",
  "Bagaimana cara merawat tanaman hias Monstera agar daunnya lebat?",
  "Sebutkan 5 fakta unik tentang hewan peliharaan kucing.",
  "Tuliskan cerita fiksi pendek bertema petualangan di luar angkasa.",
  "Apa saja persiapan fisik yang harus dilakukan sebelum mendaki gunung?",
  "Jelaskan fungsi dari masing-masing komponen komputer (CPU, RAM, GPU, Storage).",
  "Berikan resep masakan vegetarian yang tinggi protein.",
  "Bagaimana cara membuat presentasi PowerPoint yang menarik dan profesional?",
  "Apa itu gaya hidup minimalis dan apa saja manfaatnya?",
  "Jelaskan cara kerja panel surya dalam menghasilkan energi listrik.",
  "Berikan daftar pertanyaan yang sering muncul saat presentasi skripsi/tesis.",
  "Bagaimana cara membedakan berita asli dan hoaks (berita palsu) di internet?",
  "Sebutkan daftar aplikasi produktivitas wajib untuk pekerja kantoran.",
  "Jelaskan apa yang dimaksud dengan pemanasan global dan efek rumah kaca.",
  "Bagaimana cara membersihkan memori HP Android yang penuh tanpa hapus aplikasi?",
  "Buatkan contoh surat lamaran kerja dalam bahasa Inggris (Cover Letter) yang baik.",
  "Jelaskan apa itu konsep Metaverse dan bagaimana potensinya di masa depan.",
  "Apa saja tips menjaga kerahasiaan dan keamanan data pribadi di dunia maya?",
  "Ceritakan tentang mitos Ratu Pantai Selatan (Nyi Roro Kidul).",
  "Bagaimana cara memulai kebiasaan olahraga lari pagi secara konsisten?",
  "Berikan rangkuman materi biologi tentang sel tumbuhan dan sel hewan.",
  "Jelaskan alasan ilmiah mengapa langit berwarna biru pada siang hari.",
  "Apa itu diet keto dan apakah aman dilakukan dalam jangka panjang?",
  "Bagaimana cara melatih public speaking agar tidak gugup berbicara di depan umum?",
  "Sebutkan 10 kosakata bahasa asing yang memiliki makna paling indah.",
  "Tuliskan materi naskah stand-up comedy singkat bertema anak kos akhir bulan.",
  "Jelaskan bagaimana cara kerja mesin pencari Google (Google Search Engine).",
  "Berikan panduan dan frasa dasar belajar bahasa Jepang untuk pemula.",
  "Apa yang menyebabkan dinosaurus punah dari muka bumi jutaan tahun yang lalu?",
  "Bagaimana urutan skincare dan cara merawat kulit wajah berjerawat yang benar?",
  "Jelaskan konsep energi terbarukan (Renewable Energy) dan berikan contohnya."
];

export function ChatWelcome({ user, handleLogin, setInput }: ChatWelcomeProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    // Pick 4 random suggestions on mount
    const shuffled = [...ALL_SUGGESTIONS].sort(() => 0.5 - Math.random());
    setSuggestions(shuffled.slice(0, 4));
  }, []);
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 px-4">
      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-primary/20 border border-primary/10 backdrop-blur-xl overflow-hidden">
        <img src="/logo.jpg" alt="Candipuro AI Logo" className="w-full h-full object-cover" />
      </div>
      <div className="space-y-4">
        <h2 className="text-4xl md:text-5xl font-headline font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-primary to-accent drop-shadow-sm">
          Selamat datang di Candipuro AI{user.isLoggedIn && user.user?.name ? `,\n${user.user.name}` : ""}
        </h2>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto">
          {!user.isLoggedIn 
            ? "Silakan Masuk atau buat akun terlebih dahulu untuk memulai obrolan dan menyimpan riwayat percakapan Anda."
            : "Ada yang bisa saya bantu hari ini? Jangan ragu untuk bertanya apa saja kepada asisten pintar Anda!"}
        </p>
      </div>

      {!user.isLoggedIn ? (
        <Button onClick={handleLogin} className="mt-4" size="lg">
          <LogIn className="w-4 h-4 mr-2" />
          Masuk / Daftar
        </Button>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mt-8">
          {suggestions.map((example) => (
            <button
              key={example}
              onClick={() => setInput(example)}
              className="text-left p-5 rounded-2xl glass-panel hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all flex items-center justify-between group hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 border-white/60 dark:border-slate-700/50"
            >
              <span className="text-sm font-medium text-foreground/80 group-hover:text-primary transition-colors">
                {example}
              </span>
              <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
