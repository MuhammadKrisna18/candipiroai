"use client"

import React from 'react';
import { ChatSession } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Clock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatHistoryProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
}

export function ChatHistory({ sessions, currentSessionId, onSelectSession, onNewChat }: ChatHistoryProps) {
  return (
    <div className="flex flex-col h-full bg-sidebar border-r">
      <div className="p-4 border-b">
        <Button 
          onClick={onNewChat} 
          className="w-full flex gap-2 justify-center items-center font-semibold bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Recent Conversations
          </div>
          {sessions.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground italic text-center">
              No chat history yet
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={cn(
                  "w-full text-left px-3 py-3 rounded-lg text-sm transition-all flex items-start gap-3 group",
                  currentSessionId === session.id 
                    ? "bg-secondary text-primary font-medium" 
                    : "hover:bg-muted text-foreground/80"
                )}
              >
                <MessageSquare className={cn(
                  "w-4 h-4 mt-0.5 shrink-0",
                  currentSessionId === session.id ? "text-primary" : "text-muted-foreground"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{session.title || "Untitled Chat"}</div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(session.lastUpdated).toLocaleDateString()}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
