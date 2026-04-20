"use client"

import React from 'react';
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Zap, Globe, BookOpen } from "lucide-react";

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      "flex w-full mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[85%] md:max-w-[70%]",
        isUser ? "flex flex-col items-end" : "flex flex-col items-start"
      )}>
        <div className={isUser ? "chat-bubble-user" : "chat-bubble-ai"}>
          <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
        
        {!isUser && (message.detectedLanguage || message.detectedTopic) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.detectedLanguage && (
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-medium flex gap-1 items-center">
                <Globe className="w-3 h-3" />
                {message.detectedLanguage}
              </Badge>
            )}
            {message.detectedTopic && (
              <Badge variant="outline" className={cn(
                "text-[10px] py-0 px-1.5 font-medium flex gap-1 items-center border-accent text-accent-foreground",
                message.detectedTopic === 'Physics' && "bg-accent/10 border-accent"
              )}>
                {message.detectedTopic === 'Physics' ? <Zap className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                {message.detectedTopic}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
