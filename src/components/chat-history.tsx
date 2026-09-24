"use client";

import React, { useState } from 'react';
import { ChatSession } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Clock, Plus, MoreVertical, Pin, PinOff, Trash2, Search, X } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSessions = sessions.filter((s) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (s.title || "").toLowerCase().includes(query);
  });

  const pinnedSessions = filteredSessions.filter(s => s.isPinned);
  const recentSessions = filteredSessions.filter(s => !s.isPinned);

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
                <div className="truncate">{session.title || "Obrolan Tanpa Judul"}</div>
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
                      <><PinOff className="w-4 h-4 mr-2" /> Lepas Sematan</>
                    ) : (
                      <><Pin className="w-4 h-4 mr-2" /> Sematkan</>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDeleteSession(session.id)}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Hapus
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
    <div className="flex flex-col h-full bg-white/40 dark:bg-slate-950/40 backdrop-blur-md border-r border-white/40 dark:border-slate-800/50">
      <div className="p-4 border-b border-white/20 dark:border-slate-800/50 space-y-3">
        <Button 
          onClick={onNewChat} 
          className="w-full flex gap-2 justify-center items-center font-semibold bg-gradient-to-br from-primary to-blue-600 hover:shadow-lg hover:shadow-primary/30 transition-all rounded-xl py-6"
        >
          <Plus className="w-4 h-4" />
          Obrolan Baru
        </Button>

        {/* Kolom Pencarian Riwayat */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Cari riwayat obrolan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/5 dark:bg-white/5 border border-border/60 rounded-lg pl-8 pr-8 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        {filteredSessions.length === 0 ? (
          <div className="px-3 py-6 text-xs text-muted-foreground italic text-center">
            {searchQuery ? `Tidak ada obrolan dengan kata kunci "${searchQuery}"` : "Belum ada riwayat obrolan"}
          </div>
        ) : (
          <>
            {renderSessionList(pinnedSessions, "Disematkan")}
            {renderSessionList(recentSessions, "Percakapan Terakhir")}
          </>
        )}
      </ScrollArea>
    </div>
  );
}
