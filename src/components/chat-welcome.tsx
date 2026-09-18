import React from "react";
import { UserSession } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Sparkles, LogIn, ChevronRight } from "lucide-react";

interface ChatWelcomeProps {
  user: UserSession;
  handleLogin: () => void;
  setInput: (input: string) => void;
}

export function ChatWelcome({ user, handleLogin, setInput }: ChatWelcomeProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 px-4">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4 border border-white/50 dark:border-slate-800/50 shadow-xl shadow-primary/5">
        <Sparkles className="w-12 h-12 text-primary animate-pulse" />
      </div>
      <div className="space-y-4">
        <h2 className="text-4xl md:text-5xl font-headline font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-primary to-accent drop-shadow-sm">
          Selamat datang di CandipiroAI{user.isLoggedIn && user.user?.name ? `,\n${user.user.name}` : ""}
        </h2>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto">
          {!user.isLoggedIn 
            ? "Silakan Masuk atau buat akun terlebih dahulu untuk memulai obrolan dan menyimpan riwayat percakapan Anda."
            : "Ada yang bisa saya bantu hari ini? Jangan ragu untuk bertanya apa saja dalam Bahasa Indonesia maupun Inggris!"}
        </p>
      </div>

      {!user.isLoggedIn ? (
        <Button onClick={handleLogin} className="mt-4" size="lg">
          <LogIn className="w-4 h-4 mr-2" />
          Masuk / Daftar
        </Button>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mt-8">
          {[
            "Bantu saya membuat rencana perjalanan 3 hari ke Bali.",
            "Explain the concept of Artificial Intelligence to a 5 year old.",
            "Tuliskan email sopan untuk menolak tawaran pekerjaan.",
            "What are some healthy and quick breakfast recipes?",
          ].map((example) => (
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
