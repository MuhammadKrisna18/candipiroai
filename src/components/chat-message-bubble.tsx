"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown"; // ✅ HARUS DI ATAS
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Zap, Globe, BookOpen, Copy, Check } from "lucide-react";

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || "");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline && match) {
    return (
      <div className="relative group mt-4 mb-4 rounded-md overflow-hidden bg-[#1e1e1e] border border-gray-800">
        <div className="flex items-center justify-between px-4 py-1.5 bg-[#2d2d2d] text-xs text-gray-300">
          <span className="font-mono">{match[1]}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-white transition-colors p-1 rounded"
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>
        </div>
        <SyntaxHighlighter
          style={vscDarkPlus as any}
          language={match[1]}
          PreTag="div"
          customStyle={{ margin: 0, padding: '1rem', borderTopLeftRadius: 0, borderTopRightRadius: 0, fontSize: '0.875rem' }}
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      </div>
    );
  }
  return (
    <code className={cn("bg-muted px-1.5 py-0.5 rounded-md text-sm font-mono text-primary", className)} {...props}>
      {children}
    </code>
  );
};

function preprocessLaTeX(content: string): string {
  if (!content) return "";
  // 1. Repair control characters corrupted by JSON parser (\x0C for \frac, \x08 for \beta, \r for \rho, etc.)
  let processed = content
    .replace(/\x0C([a-zA-Z]+)/g, "\\f$1")
    .replace(/\x08([a-zA-Z]+)/g, "\\b$1")
    .replace(/\r(?!\n)([a-zA-Z]+)/g, "\\r$1")
    .replace(/\t(imes|heta|au|ext|o\b|an\b|riangle|ilde|frac)/g, "\\t$1");

  // 2. Ensure headings (###, ##) attached after sentences have newlines
  processed = processed.replace(/([.!?])\s+(#{1,6}\s+)/g, "$1\n\n$2");

  // 3. Convert \[ ... \] block math to $$ ... $$
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (_, eq) => `\n$$\n${eq.trim()}\n$$\n`);
  
  // 4. Convert \( ... \) inline math to $ ... $
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (_, eq) => `$${eq.trim()}$`);
  
  return processed;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyMessage = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "flex w-full mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] md:max-w-[70%]",
          isUser ? "flex flex-col items-end" : "flex flex-col items-start",
        )}
      >
        <div className={isUser ? "chat-bubble-user" : "chat-bubble-ai"}>
          {/* ✅ MARKDOWN RENDER */}
          <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[
                [rehypeKatex as any, { strict: false, throwOnError: false, errorColor: 'currentColor' }]
              ]}
              components={{
                code: CodeBlock as any
              }}
            >
              {preprocessLaTeX(message.content)}
            </ReactMarkdown>
          </div>
        </div>

        {!isUser && (
          <div className="flex flex-wrap items-center gap-2 mt-2 w-full">
            {message.detectedLanguage && (
              <Badge
                variant="secondary"
                className="text-[10px] py-0 px-1.5 font-medium flex gap-1 items-center"
              >
                <Globe className="w-3 h-3" />
                {message.detectedLanguage}
              </Badge>
            )}
            {message.detectedTopic && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] py-0 px-1.5 font-medium flex gap-1 items-center border-primary/40 text-primary dark:text-primary-foreground",
                  message.detectedTopic.toLowerCase() === "programming" &&
                    "bg-primary/10 border-primary",
                )}
              >
                {message.detectedTopic.toLowerCase() === "programming" ? (
                  <Zap className="w-3 h-3" />
                ) : (
                  <BookOpen className="w-3 h-3" />
                )}
                {message.detectedTopic}
              </Badge>
            )}

            {/* Tombol Salin per Jawaban */}
            <button
              onClick={handleCopyMessage}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-muted/80 transition-colors ml-auto group"
              title="Salin seluruh isi jawaban"
            >
              {isCopied ? (
                <>
                  <Check className="w-3 h-3 text-green-500" />
                  <span className="text-green-600 dark:text-green-400 font-medium">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span>Salin Jawaban</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
