import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const MAX_TOKENS_LOGGED_IN = 50000;
export const MAX_TOKENS_ANONYMOUS = 10000;
export const RESET_WINDOW_MS = 3 * 60 * 60 * 1000; // 3 hours

export interface QuotaRecord {
  usedTokens: number;
  resetTime: number;
}

export async function getQuota(id: string): Promise<QuotaRecord> {
  const now = Date.now();
  if (!db) {
    return { usedTokens: 0, resetTime: now + RESET_WINDOW_MS };
  }

  const quotaRef = doc(db, "quotas", id);
  const snap = await getDoc(quotaRef);
  
  if (snap.exists()) {
    const data = snap.data() as QuotaRecord;
    if (now > data.resetTime) {
      const newRecord = { usedTokens: 0, resetTime: now + RESET_WINDOW_MS };
      await setDoc(quotaRef, newRecord);
      return newRecord;
    }
    return data;
  }

  const record = { usedTokens: 0, resetTime: now + RESET_WINDOW_MS };
  await setDoc(quotaRef, record);
  return record;
}

export async function updateQuota(id: string, tokensUsed: number): Promise<QuotaRecord> {
  const record = await getQuota(id);
  record.usedTokens += tokensUsed;
  
  if (db) {
    await setDoc(doc(db, "quotas", id), record);
  }
  return record;
}
