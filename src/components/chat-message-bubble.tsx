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

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";

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
              rehypePlugins={[rehypeKatex]}
              components={{
                code: CodeBlock as any
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {!isUser && (message.detectedLanguage || message.detectedTopic) && (
          <div className="flex flex-wrap gap-2 mt-2">
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
                  "text-[10px] py-0 px-1.5 font-medium flex gap-1 items-center border-accent text-accent-foreground",
                  message.detectedTopic.toLowerCase() === "programming" &&
                    "bg-accent/10 border-accent",
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
          </div>
        )}
      </div>
    </div>
  );
}
