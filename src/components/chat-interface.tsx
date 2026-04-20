"use client"

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatSession, UserSession } from "@/lib/types";
import { ChatMessageBubble } from "./chat-message-bubble";
import { ChatHistory } from "./chat-history";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Send, 
  Settings, 
  LogOut, 
  LogIn, 
  User, 
  Menu, 
  Sparkles, 
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { intelligentBilingualChatResponse } from "@/ai/flows/intelligent-bilingual-chat-response";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ChatInterface() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [user, setUser] = useState<UserSession>({ isLoggedIn: false });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessions, currentSessionId]);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const handleNewChat = () => {
    const newSessionId = crypto.randomUUID();
    const newSession: ChatSession = {
      id: newSessionId,
      title: "New Conversation",
      lastUpdated: Date.now(),
      messages: []
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSessionId);
    setInput('');
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      const newSession: ChatSession = {
        id: sessionId,
        title: input.slice(0, 30) + (input.length > 30 ? "..." : ""),
        lastUpdated: Date.now(),
        messages: []
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(sessionId);
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          messages: [...s.messages, userMessage],
          lastUpdated: Date.now(),
          title: s.messages.length === 0 ? input.slice(0, 30) + (input.length > 30 ? "..." : "") : s.title
        };
      }
      return s;
    }));

    setInput('');
    setIsLoading(true);

    try {
      const response = await intelligentBilingualChatResponse({ question: input });
      
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'ai',
        content: response.answer,
        timestamp: Date.now(),
        detectedLanguage: response.detectedLanguage,
        detectedTopic: response.detectedTopic
      };

      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            messages: [...s.messages, aiMessage],
            lastUpdated: Date.now()
          };
        }
        return s;
      }));
    } catch (error) {
      console.error("Failed to get AI response:", error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'ai',
        content: "Sorry, I encountered an error. Please try again later.",
        timestamp: Date.now()
      };
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return { ...s, messages: [...s.messages, errorMessage] };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    setUser({
      isLoggedIn: true,
      user: {
        name: "Guest Explorer",
        email: "explorer@scigenius.com",
        avatar: "https://picsum.photos/seed/user/100/100"
      }
    });
  };

  const handleLogout = () => {
    setUser({ isLoggedIn: false });
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-80 shrink-0">
        <ChatHistory 
          sessions={sessions} 
          currentSessionId={currentSessionId}
          onSelectSession={setCurrentSessionId}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Main Chat Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <ChatHistory 
                  sessions={sessions} 
                  currentSessionId={currentSessionId}
                  onSelectSession={(id) => {
                    setCurrentSessionId(id);
                    setIsSidebarOpen(false);
                  }}
                  onNewChat={() => {
                    handleNewChat();
                    setIsSidebarOpen(false);
                  }}
                />
              </SheetContent>
            </Sheet>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                SciGenius Chat
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user.isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-semibold">{user.user?.name}</p>
                  <p className="text-[10px] text-muted-foreground">{user.user?.email}</p>
                </div>
                <Avatar className="w-8 h-8 border">
                  <AvatarImage src={user.user?.avatar} />
                  <AvatarFallback><User /></AvatarFallback>
                </Avatar>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                  <LogOut className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={handleLogin} className="flex gap-2">
                <LogIn className="w-4 h-4" />
                Login
              </Button>
            )}
          </div>
        </header>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 px-4 md:px-8 py-6">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            {!currentSession || currentSession.messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 opacity-0 animate-in fade-in zoom-in-95 duration-700 fill-mode-forwards">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-primary">How can I assist you today?</h2>
                  <p className="text-muted-foreground max-w-lg mx-auto">
                    Ask me anything about physics, friction, or general knowledge in Indonesian or English.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mt-8">
                  {[
                    "Apa itu gaya gesek statis?",
                    "Explain Newton's laws of motion.",
                    "Siapa penemu lampu pijar?",
                    "How does air resistance affect falling objects?"
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => setInput(example)}
                      className="text-left p-4 rounded-xl border border-border bg-white hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-between group"
                    >
                      <span className="text-sm font-medium text-foreground/80 group-hover:text-primary">{example}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {currentSession.messages.map((msg) => (
                  <ChatMessageBubble key={msg.id} message={msg} />
                ))}
                {isLoading && (
                  <div className="flex justify-start mb-6 animate-pulse">
                    <div className="chat-bubble-ai flex gap-2 items-center">
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce delay-150" />
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce delay-300" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 md:p-8 pt-0">
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-white dark:bg-card rounded-2xl border shadow-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Textarea
                placeholder="Type your question here... (Indonesian or English)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="w-full min-h-[60px] max-h-48 border-0 focus-visible:ring-0 resize-none py-4 px-6 text-base leading-relaxed"
              />
              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
                <div className="flex gap-1 text-[10px] text-muted-foreground items-center font-medium">
                  <ShieldCheck className="w-3 h-3 text-accent" />
                  Physics & Knowledge Assistant
                </div>
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!input.trim() || isLoading}
                  size="sm"
                  className="rounded-full px-5 font-semibold transition-all"
                >
                  {isLoading ? "Thinking..." : "Send"}
                  {!isLoading && <Send className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </div>
            <p className="text-center text-[10px] text-muted-foreground mt-3 uppercase tracking-widest font-semibold opacity-60">
              Powered by SciGenius AI
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
