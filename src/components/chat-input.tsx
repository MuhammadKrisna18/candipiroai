import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  handleSendMessage: () => void;
}

export function ChatInput({ input, setInput, isLoading, handleSendMessage }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const onSend = () => {
    handleSendMessage();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  return (
    <div className="p-4 md:p-6 relative z-10">
      <div className="max-w-3xl mx-auto">
        <div className="relative bg-transparent border border-border/80 dark:border-slate-800 rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300 shadow-sm focus-within:shadow-md flex items-end p-2 backdrop-blur-md">
          <Textarea
            ref={textareaRef}
            placeholder="Ketik pertanyaan Anda..."
            value={input}
            onChange={handleInput}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            className="w-full min-h-[44px] max-h-32 border-0 focus-visible:ring-0 resize-none py-3 px-4 text-sm md:text-base leading-relaxed bg-transparent"
            rows={1}
          />
          <div className="flex items-center gap-2 pr-2 pb-1 shrink-0">
            <Button
              onClick={onSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="rounded-full w-10 h-10 transition-all bg-gradient-to-br from-primary to-blue-600 hover:shadow-lg hover:shadow-primary/30"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-3 uppercase tracking-widest font-semibold opacity-60">
          Powered by CandipiroAI
        </p>
      </div>
    </div>
  );
}
