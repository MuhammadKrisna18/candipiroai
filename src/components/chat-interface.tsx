"use client";

import React, { useState, useRef, useEffect } from "react";
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
  ShieldCheck,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AuthDialog } from "./auth-dialog";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc, query, orderBy } from "firebase/firestore";

export function ChatInterface() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [user, setUser] = useState<UserSession>({ isLoggedIn: false });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessions, currentSessionId]);

  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          isLoggedIn: true,
          user: {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || "User",
            email: firebaseUser.email || "",
            avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${firebaseUser.email}`,
          },
        });
      } else {
        setUser({ isLoggedIn: false });
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user.isLoggedIn || !user.user?.uid || !db) {
      setSessions([]);
      setCurrentSessionId(null);
      setIsInitialized(true);
      return;
    }

    const q = query(collection(db, "users", user.user.uid, "sessions"), orderBy("lastUpdated", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedSessions: ChatSession[] = [];
      snapshot.forEach((doc) => {
        loadedSessions.push(doc.data() as ChatSession);
      });
      setSessions(loadedSessions);
      
      if (loadedSessions.length > 0) {
        setCurrentSessionId((prevId) => {
          // Keep current selection if valid, otherwise do not auto-select anything on refresh.
          if (prevId && loadedSessions.find(s => s.id === prevId)) return prevId;
          return null;
        });
      } else {
        setCurrentSessionId(null);
      }
      setIsInitialized(true);
    }, (error) => {
      console.error("Error fetching sessions:", error);
      setSessions([]);
      setIsInitialized(true);
    });

    return () => unsubscribe();
  }, [user.isLoggedIn, user.user?.uid, isAuthLoading]);

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  const saveSession = async (session: ChatSession) => {
    if (user.isLoggedIn && user.user?.uid && db) {
      try {
        await setDoc(doc(db, "users", user.user.uid, "sessions", session.id), session);
      } catch (e) {
        console.error("Error saving session", e);
      }
    } else {
      setSessions((prev) => {
        const exists = prev.find(s => s.id === session.id);
        if (exists) {
          return prev.map(s => s.id === session.id ? session : s).sort((a, b) => b.lastUpdated - a.lastUpdated);
        }
        return [session, ...prev].sort((a, b) => b.lastUpdated - a.lastUpdated);
      });
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (user.isLoggedIn && user.user?.uid && db) {
      try {
        await deleteDoc(doc(db, "users", user.user.uid, "sessions", sessionId));
        if (currentSessionId === sessionId) {
          const filtered = sessions.filter(s => s.id !== sessionId);
          setCurrentSessionId(filtered.length > 0 ? filtered[0].id : null);
        }
      } catch (e) {
        console.error("Error deleting session", e);
      }
    } else {
      setSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== sessionId);
        if (currentSessionId === sessionId) {
          setCurrentSessionId(filtered.length > 0 ? filtered[0].id : null);
        }
        return filtered;
      });
    }
  };

  const handleTogglePin = async (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    
    const pinnedCount = sessions.filter((s) => s.isPinned).length;
    if (!session.isPinned && pinnedCount >= 5) {
      alert("You can only pin up to 5 conversations.");
      return;
    }

    const updatedSession = { ...session, isPinned: !session.isPinned };
    await saveSession(updatedSession);
  };

  const handleNewChat = () => {
    const newSessionId = crypto.randomUUID();
    const newSession: ChatSession = {
      id: newSessionId,
      title: "New Conversation",
      lastUpdated: Date.now(),
      messages: [],
    };
    saveSession(newSession).then(() => {
      setCurrentSessionId(newSessionId);
      setInput("");
    });
  };

  const handleSaveName = async () => {
    if (!editedName.trim() || !auth?.currentUser) {
      setIsEditingName(false);
      return;
    }
    try {
      await updateProfile(auth.currentUser, { displayName: editedName });
      setUser((prev) => ({
        ...prev,
        user: prev.user ? { ...prev.user, name: editedName } : undefined,
      }));
    } catch (e) {
      console.error("Error updating name:", e);
    }
    setIsEditingName(false);
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

    const sessionWithUserMsg: ChatSession = {
      ...targetSession,
      messages: [...targetSession.messages, userMessage],
      lastUpdated: Date.now(),
      title: targetSession.messages.length === 0
          ? input.slice(0, 30) + (input.length > 30 ? "..." : "")
          : targetSession.title,
    };
    
    await saveSession(sessionWithUserMsg);
    
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setIsLoading(true);

    const messagesToSend = [...targetSession.messages, userMessage].map((msg) => ({
      role: msg.role === "ai" ? "assistant" : msg.role,
      content: msg.content,
    }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagesToSend }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");

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
        messages: [...sessionWithUserMsg.messages, aiMessage],
        lastUpdated: Date.now(),
      };
      
      await saveSession(finalSession);
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
        messages: [...sessionWithUserMsg.messages, errorMessage],
        lastUpdated: Date.now(),
      };
      await saveSession(errorSession);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    setIsAuthDialogOpen(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
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
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 glass-nav sticky top-0 z-10 transition-all">
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
                  onDeleteSession={handleDeleteSession}
                  onTogglePin={handleTogglePin}
                />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-headline font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                CandipiroAI
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user.isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p
                    className="text-xs font-semibold cursor-pointer hover:underline"
                    onClick={() => {
                      setEditedName(user.user?.name || "");
                      setIsEditingName(true);
                    }}
                    title="Klik untuk mengubah nama"
                  >
                    {user.user?.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {user.user?.email}
                  </p>
                </div>
                <Avatar className="w-8 h-8 border">
                  <AvatarImage src={user.user?.avatar} />
                  <AvatarFallback>
                    <User />
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={handleLogin} className="flex gap-2">
                <LogIn className="w-4 h-4" />
                Masuk
              </Button>
            )}
          </div>
        </header>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 px-4 md:px-8 py-6">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            {!isInitialized ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                <Sparkles className="w-8 h-8 text-primary animate-pulse mb-4" />
                <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
              </div>
            ) : (!currentSession || currentSession.messages.length === 0) ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 px-4">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4 border border-white/50 dark:border-slate-800/50 shadow-xl shadow-primary/5">
                  <Sparkles className="w-12 h-12 text-primary animate-pulse" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-headline font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-primary to-accent drop-shadow-sm">
                    Selamat datang di CandipiroAI{user.isLoggedIn && user.user?.name ? `,\n${user.user.name}` : ""}
                  </h2>
                  <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                    {!user.isLoggedIn 
                      ? "Silakan Masuk atau buat akun terlebih dahulu untuk memulai obrolan dan menyimpan riwayat percakapan Anda."
                      : "Ada yang bisa saya bantu hari ini? Jangan ragu untuk bertanya apa saja dalam Bahasa Indonesia maupun Inggris!"}
                  </p>
                </div>

                {!user.isLoggedIn ? (
                  <Button onClick={handleLogin} className="mt-4" size="lg">
                    <LogIn className="w-4 h-4 mr-2" />
                    Masuk / Daftar
                  </Button>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mt-8">
                    {[
                      "Bantu saya membuat rencana perjalanan 3 hari ke Bali.",
                      "Explain the concept of Artificial Intelligence to a 5 year old.",
                      "Tuliskan email sopan untuk menolak tawaran pekerjaan.",
                      "What are some healthy and quick breakfast recipes?",
                    ].map((example) => (
                      <button
                        key={example}
                        onClick={() => setInput(example)}
                        className="text-left p-5 rounded-2xl glass-panel hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all flex items-center justify-between group hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 border-white/60 dark:border-slate-700/50"
                      >
                        <span className="text-sm font-medium text-foreground/80 group-hover:text-primary transition-colors">
                          {example}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {currentSession.messages.map((msg) => (
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
        <div className="p-4 md:p-8 pt-0 pb-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="relative glass-panel rounded-3xl overflow-hidden focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
              <Textarea
                ref={textareaRef}
                placeholder="Ketik pertanyaan Anda di sini... (Bahasa Indonesia atau Inggris)"
                value={input}
                onChange={handleInput}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="w-full min-h-[60px] max-h-48 border-0 focus-visible:ring-0 resize-none py-4 px-6 text-base leading-relaxed"
              />
              <div className="flex items-center justify-between px-6 py-3 border-t border-white/20 dark:border-slate-800/50 bg-white/30 dark:bg-slate-900/30">
                <div className="flex gap-1 text-[10px] text-muted-foreground items-center font-medium">
                  <ShieldCheck className="w-3 h-3 text-accent" />
                  CandipiroAI
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="rounded-full px-6 py-5 font-semibold transition-all bg-gradient-to-br from-primary to-blue-600 hover:shadow-lg hover:shadow-primary/30"
                >
                  {isLoading ? "Memikirkan..." : "Kirim"}
                  {!isLoading && <Send className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </div>
            <p className="text-center text-[10px] text-muted-foreground mt-3 uppercase tracking-widest font-semibold opacity-60">
              Powered by CandipiroAI
            </p>
          </div>
        </div>
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
                if (e.key === "Enter") handleSaveName();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingName(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveName}>
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
