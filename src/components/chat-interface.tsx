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
import { AuthDialog } from "./auth-dialog";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
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

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
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
      
      // Auto-select the first session if none is selected
      if (loadedSessions.length > 0) {
        setCurrentSessionId((prevId) => {
          if (!prevId || !loadedSessions.find(s => s.id === prevId)) {
            return loadedSessions[0].id;
          }
          return prevId;
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
  }, [user.isLoggedIn, user.user?.uid]);

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
    <div className="flex h-screen bg-background overflow-hidden">
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
                  onDeleteSession={handleDeleteSession}
                  onTogglePin={handleTogglePin}
                />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                CandipiroAI
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user.isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-semibold">{user.user?.name}</p>
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
                  title="Logout"
                >
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
                  <h2 className="text-3xl font-bold text-primary">
                    How can I assist you today?
                  </h2>
                  <p className="text-muted-foreground max-w-lg mx-auto">
                    Ask me anything about physics, friction, or general
                    knowledge in Indonesian or English.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mt-8">
                  {[
                    "Apa itu gaya gesek statis?",
                    "Explain Newton's laws of motion.",
                    "Siapa penemu lampu pijar?",
                    "How does air resistance affect falling objects?",
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => setInput(example)}
                      className="text-left p-4 rounded-xl border border-border bg-white hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-between group"
                    >
                      <span className="text-sm font-medium text-foreground/80 group-hover:text-primary">
                        {example}
                      </span>
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
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="w-full min-h-[60px] max-h-48 border-0 focus-visible:ring-0 resize-none py-4 px-6 text-base leading-relaxed"
              />
              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
                <div className="flex gap-1 text-[10px] text-muted-foreground items-center font-medium">
                  <ShieldCheck className="w-3 h-3 text-accent" />
                  CandipiroAI
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
              Powered by CandipiroAI
            </p>
          </div>
        </div>
      </div>
      <AuthDialog isOpen={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />
    </div>
  );
}
