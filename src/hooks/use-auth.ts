import { useState, useEffect } from "react";
import { UserSession } from "@/lib/types";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";

export function useAuth() {
  const [user, setUser] = useState<UserSession>({ isLoggedIn: false });
  const [isAuthLoading, setIsAuthLoading] = useState(true);

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSaveName = async (editedName: string) => {
    if (!editedName.trim() || !auth?.currentUser) return false;
    try {
      await updateProfile(auth.currentUser, { displayName: editedName });
      setUser((prev) => ({
        ...prev,
        user: prev.user ? { ...prev.user, name: editedName } : undefined,
      }));
      return true;
    } catch (e) {
      console.error("Error updating name:", e);
      return false;
    }
  };

  return { user, isAuthLoading, handleLogout, handleSaveName };
}
