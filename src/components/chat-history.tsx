"use client"

import React from 'react';
import { ChatSession } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Clock, Plus, MoreVertical, Pin, PinOff, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatHistoryProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  onTogglePin: (sessionId: string) => void;
}

export function ChatHistory({ 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onNewChat,
  onDeleteSession,
  onTogglePin
}: ChatHistoryProps) {
  
  const pinnedSessions = sessions.filter(s => s.isPinned);
  const recentSessions = sessions.filter(s => !s.isPinned);

  const renderSessionList = (list: ChatSession[], label: string) => {
    if (list.length === 0) return null;
    return (
      <div className="p-2 space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </div>
        {list.map((session) => (
          <div key={session.id} className="relative group">
            <button
              onClick={() => onSelectSession(session.id)}
              className={cn(
                "w-full text-left px-3 py-3 pr-10 rounded-lg text-sm transition-all flex items-start gap-3",
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
            
            <div className="absolute right-1 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => onTogglePin(session.id)}>
                    {session.isPinned ? (
                      <><PinOff className="w-4 h-4 mr-2" /> Unpin</>
                    ) : (
                      <><Pin className="w-4 h-4 mr-2" /> Pin</>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDeleteSession(session.id)}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    );
  };

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
        {sessions.length === 0 ? (
          <div className="px-3 py-4 text-sm text-muted-foreground italic text-center mt-4">
            No chat history yet
          </div>
        ) : (
          <>
            {renderSessionList(pinnedSessions, "Pinned")}
            {renderSessionList(recentSessions, "Recent Conversations")}
          </>
        )}
      </ScrollArea>
    </div>
  );
}
