import { useState, useEffect } from "react";
import { ChatSession, UserSession } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, doc, onSnapshot, setDoc, deleteDoc, query, orderBy } from "firebase/firestore";

export function useChatSessions(user: UserSession, isAuthLoading: boolean) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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

  const saveSession = async (session: ChatSession) => {
    if (user.isLoggedIn && user.user?.uid && db) {
      try {
        const { messages, ...sessionMeta } = session;
        await setDoc(doc(db, "users", user.user.uid, "sessions", session.id), sessionMeta);
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

  const updateSessionTitle = async (sessionId: string, newTitle: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    const updatedSession = { ...session, title: newTitle };
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
    });
    return newSessionId;
  };

  return {
    sessions,
    setSessions,
    currentSessionId,
    setCurrentSessionId,
    isInitialized,
    saveSession,
    updateSessionTitle,
    handleDeleteSession,
    handleTogglePin,
    handleNewChat
  };
}
