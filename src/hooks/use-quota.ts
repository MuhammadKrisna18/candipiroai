import { useState, useEffect } from "react";
import { UserSession } from "@/lib/types";

export interface QuotaData {
  percentage: number;
  used: number;
  max: number;
  resetTime: number;
}

export function useQuota(user: UserSession, isAuthLoading: boolean) {
  const [quota, setQuota] = useState<QuotaData | null>(null);

  const fetchQuota = async () => {
    let url = "/api/quota";
    if (user.isLoggedIn && user.user?.uid) {
      url += `?uid=${user.user.uid}`;
    }
    try {
      const res = await fetch(url);
      const data = await res.json();
      setQuota(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isAuthLoading) return;
    fetchQuota();
  }, [user.isLoggedIn, user.user?.uid, isAuthLoading]);

  // Auto-refresh quota when resetTime arrives
  useEffect(() => {
    if (!quota?.resetTime) return;
    const remainingMs = quota.resetTime - Date.now();
    if (remainingMs <= 0) {
      if (quota.used > 0) {
        fetchQuota();
      }
      return;
    }
    const timer = setTimeout(() => {
      fetchQuota();
    }, remainingMs + 1000);
    return () => clearTimeout(timer);
  }, [quota?.resetTime, quota?.used]);

  return { quota, setQuota, fetchQuota };
}
