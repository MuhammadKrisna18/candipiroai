import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Clock, LogIn } from "lucide-react";
import { QuotaData } from "@/hooks/use-quota";

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  handleSendMessage: () => void;
  quota?: QuotaData | null;
  isLoggedIn?: boolean;
  onOpenLogin?: () => void;
}

export function ChatInput({
  input,
  setInput,
  isLoading,
  handleSendMessage,
  quota,
  isLoggedIn,
  onOpenLogin
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [remainingText, setRemainingText] = useState<string>("");

  const isQuotaExceeded = !!quota && quota.used >= quota.max;
  const resetDate = quota ? new Date(quota.resetTime) : null;
  const timeStr = resetDate ? resetDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "";

  useEffect(() => {
    if (!quota?.resetTime) return;

    const updateRemaining = () => {
      const diffMs = Math.max(0, quota.resetTime - Date.now());
      const diffMinutes = Math.ceil(diffMs / (1000 * 60));
      if (diffMinutes <= 1) {
        setRemainingText("kurang dari 1 menit lagi");
      } else if (diffMinutes < 60) {
        setRemainingText(`sekitar ${diffMinutes} menit lagi`);
      } else {
        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        setRemainingText(mins > 0 ? `sekitar ${hours} jam ${mins} menit lagi` : `sekitar ${hours} jam lagi`);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 30000);
    return () => clearInterval(interval);
  }, [quota?.resetTime]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const onSend = () => {
    if (isQuotaExceeded || isLoading) return;
    handleSendMessage();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  return (
    <div className="p-4 md:p-6 relative z-10">
      <div className="max-w-3xl mx-auto">
        {/* Quota Exceeded Notification Banner */}
        {isQuotaExceeded && (
          <div className="mb-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 text-xs md:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm backdrop-blur-md animate-in fade-in slide-in-from-bottom-1 duration-300">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>Batas energi Anda telah habis.</strong> Energi akan di-reset otomatis pada pukul <strong>{timeStr} WIB</strong> ({remainingText}).
              </span>
            </div>
            {!isLoggedIn && onOpenLogin && (
              <Button
                size="sm"
                onClick={onOpenLogin}
                className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white shrink-0 shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5 mr-1.5" /> Masuk untuk 50.000 Token
              </Button>
            )}
          </div>
        )}

        <div className="relative bg-transparent border border-border/80 dark:border-slate-800 rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300 shadow-sm focus-within:shadow-md flex items-end p-2 backdrop-blur-md">
          <Textarea
            ref={textareaRef}
            placeholder={
              isQuotaExceeded
                ? `Energi habis. Reset pada pukul ${timeStr} WIB (${remainingText})...`
                : "Ketik pertanyaan Anda..."
            }
            value={input}
            onChange={handleInput}
            disabled={isQuotaExceeded || isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            className="w-full min-h-[44px] max-h-32 border-0 focus-visible:ring-0 resize-none py-3 px-4 text-sm md:text-base leading-relaxed bg-transparent disabled:opacity-60 disabled:cursor-not-allowed"
            rows={1}
          />
          <div className="flex items-center gap-2 pr-2 pb-1 shrink-0">
            <Button
              onClick={onSend}
              disabled={!input.trim() || isLoading || isQuotaExceeded}
              size="icon"
              className="rounded-full w-10 h-10 transition-all bg-gradient-to-br from-primary to-blue-600 hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-3 uppercase tracking-widest font-semibold opacity-60">
          Powered by Candipuro AI
        </p>
      </div>
    </div>
  );
}
