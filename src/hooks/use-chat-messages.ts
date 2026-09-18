import { useState, useEffect } from "react";
import { ChatMessage, UserSession } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, doc, onSnapshot, setDoc, query, orderBy } from "firebase/firestore";

export function useChatMessages(user: UserSession, currentSessionId: string | null, isAuthLoading: boolean) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user.isLoggedIn || !user.user?.uid || !db || !currentSessionId) {
      // Local or not logged in, we rely on in-memory or we can just return empty
      setMessages([]);
      return;
    }

    setIsMessagesLoading(true);
    const q = query(
      collection(db, "users", user.user.uid, "sessions", currentSessionId, "messages"), 
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        loadedMessages.push(doc.data() as ChatMessage);
      });
      setMessages(loadedMessages);
      setIsMessagesLoading(false);
    }, (error) => {
      console.error("Error fetching messages:", error);
      setMessages([]);
      setIsMessagesLoading(false);
    });

    return () => unsubscribe();
  }, [user.isLoggedIn, user.user?.uid, currentSessionId, isAuthLoading]);

  const saveMessage = async (sessionId: string, message: ChatMessage) => {
    if (user.isLoggedIn && user.user?.uid && db) {
      try {
        await setDoc(doc(db, "users", user.user.uid, "sessions", sessionId, "messages", message.id), message);
      } catch (e) {
        console.error("Error saving message", e);
      }
    }
  };

  return {
    messages,
    setMessages, // Usually used only for optimistic updates or local mode
    isMessagesLoading,
    saveMessage
  };
}
