import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { QUOTA_CONFIG } from "@/config/app.config";

export const MAX_TOKENS_LOGGED_IN = QUOTA_CONFIG.maxTokensLoggedIn;
export const MAX_TOKENS_ANONYMOUS = QUOTA_CONFIG.maxTokensAnonymous;
export const RESET_WINDOW_MS = QUOTA_CONFIG.resetWindowMs;

export interface QuotaRecord {
  usedTokens: number;
  resetTime: number;
}

export async function getQuota(id: string): Promise<QuotaRecord> {
  const now = Date.now();
  if (!db) {
    return { usedTokens: 0, resetTime: now + RESET_WINDOW_MS };
  }

  const quotaRef = doc(db, QUOTA_CONFIG.collectionName, id);
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
    await setDoc(doc(db, QUOTA_CONFIG.collectionName, id), record);
  }
  return record;
}
