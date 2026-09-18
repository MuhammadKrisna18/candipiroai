"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, ChatSession } from "@/lib/types";
import { ChatMessageBubble } from "./chat-message-bubble";
import { ChatHistory } from "./chat-history";
import { ChatHeader } from "./chat-header";
import { ChatWelcome } from "./chat-welcome";
import { ChatInput } from "./chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "./auth-dialog";

import { useAuth } from "@/hooks/use-auth";
import { useQuota } from "@/hooks/use-quota";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { useChatMessages } from "@/hooks/use-chat-messages";

export function ChatInterface() {
  const { user, isAuthLoading, handleLogout, handleSaveName } = useAuth();
  const { quota, setQuota } = useQuota(user, isAuthLoading);
  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    isInitialized,
    saveSession,
    handleDeleteSession,
    handleTogglePin,
    handleNewChat
  } = useChatSessions(user, isAuthLoading);

  const {
    messages: dbMessages,
    isMessagesLoading,
    saveMessage
  } = useChatMessages(user, currentSessionId, isAuthLoading);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const activeMessages = user.isLoggedIn ? dbMessages : (currentSession?.messages || []);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages, currentSessionId]);

  const onSaveName = async () => {
    const success = await handleSaveName(editedName);
    if (success) setIsEditingName(false);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    let sessionId = currentSessionId;
    let targetSession = sessions.find((s) => s.id === sessionId);
    
    if (!sessionId || !targetSession) {
      sessionId = crypto.randomUUID();
      targetSession = {
        id: sessionId,
        title: input.slice(0, 30) + (input.length > 30 ? "..." : ""),
        lastUpdated: Date.now(),
        messages: [],
      };
      setCurrentSessionId(sessionId);
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: Date.now(),
    };

    // Update Session Metadata (and local messages if guest)
    const sessionWithUserMsg: ChatSession = {
      ...targetSession,
      messages: user.isLoggedIn ? undefined : [...activeMessages, userMessage],
      lastUpdated: Date.now(),
      title: activeMessages.length === 0
          ? input.slice(0, 30) + (input.length > 30 ? "..." : "")
          : targetSession.title,
    };
    
    await saveSession(sessionWithUserMsg);
    if (user.isLoggedIn) {
      await saveMessage(sessionId, userMessage);
    }
    
    setInput("");
    setIsLoading(true);

    const messagesToSend = [...activeMessages, userMessage].map((msg) => ({
      role: msg.role === "ai" ? "assistant" : msg.role,
      content: msg.content,
    }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: messagesToSend,
          uid: user.isLoggedIn ? user.user?.uid : undefined
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");

      if (data.quota) {
        setQuota(data.quota);
      }

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "ai",
        content: data.answer,
        timestamp: Date.now(),
        detectedLanguage: data.detectedLanguage,
        detectedTopic: data.detectedTopic,
      };

      const finalSession = {
        ...sessionWithUserMsg,
        messages: user.isLoggedIn ? undefined : [...activeMessages, userMessage, aiMessage],
        lastUpdated: Date.now(),
      };
      
      await saveSession(finalSession);
      if (user.isLoggedIn) {
        await saveMessage(sessionId, aiMessage);
      }

    } catch (error) {
      console.error("Failed to get AI response:", error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "ai",
        content: "Sorry, I encountered an error. Please try again later.",
        timestamp: Date.now(),
      };
      
      const errorSession = {
        ...sessionWithUserMsg,
        messages: user.isLoggedIn ? undefined : [...activeMessages, userMessage, errorMessage],
        lastUpdated: Date.now(),
      };
      await saveSession(errorSession);
      if (user.isLoggedIn) {
        await saveMessage(sessionId, errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background font-body">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-80 shrink-0">
        <ChatHistory
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={setCurrentSessionId}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          onTogglePin={handleTogglePin}
        />
      </div>

      {/* Main Chat Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          user={user}
          quota={quota}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          sessions={sessions}
          currentSessionId={currentSessionId}
          setCurrentSessionId={setCurrentSessionId}
          handleNewChat={handleNewChat}
          handleDeleteSession={handleDeleteSession}
          handleTogglePin={handleTogglePin}
          setEditedName={setEditedName}
          setIsEditingName={setIsEditingName}
          handleLogout={handleLogout}
          handleLogin={() => setIsAuthDialogOpen(true)}
        />

        {/* Chat Messages */}
        <ScrollArea className="flex-1 px-4 md:px-8 py-6">
          <div className="max-w-6xl mx-auto h-full flex flex-col">
            {!isInitialized || isAuthLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                <p className="text-sm text-muted-foreground animate-pulse">Memuat aplikasi...</p>
              </div>
            ) : (!currentSession || activeMessages.length === 0) ? (
              <ChatWelcome
                user={user}
                handleLogin={() => setIsAuthDialogOpen(true)}
                setInput={setInput}
              />
            ) : (
              <div className="space-y-2">
                {isMessagesLoading && (
                   <div className="text-center text-xs text-muted-foreground py-4 animate-pulse">Memuat riwayat pesan...</div>
                )}
                {activeMessages.map((msg) => (
                  <ChatMessageBubble key={msg.id} message={msg} />
                ))}
                {isLoading && (
                  <div className="flex w-full mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out justify-start">
                    <div className="max-w-[85%] md:max-w-[70%] flex flex-col items-start">
                      <div className="chat-bubble-ai flex items-center gap-1.5 h-10 px-4">
                        <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <ChatInput
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          handleSendMessage={handleSendMessage}
        />
      </div>
      
      <AuthDialog isOpen={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />
      
      {/* Edit Name Dialog */}
      <Dialog open={isEditingName} onOpenChange={setIsEditingName}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah Nama Profil</DialogTitle>
            <DialogDescription>
              Masukkan nama panggilan Anda yang baru.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <Input
              autoFocus
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              placeholder="Nama panggilan"
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveName();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingName(false)}>
              Batal
            </Button>
            <Button onClick={onSaveName}>
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
