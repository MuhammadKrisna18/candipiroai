export const MAX_TOKENS_LOGGED_IN = 5000;
export const MAX_TOKENS_ANONYMOUS = 1000;
export const RESET_WINDOW_MS = 3 * 60 * 60 * 1000; // 3 hours

export interface QuotaRecord {
  usedTokens: number;
  resetTime: number;
}

// In-memory store (IP -> QuotaRecord)
export const tokenQuotaMap = new Map<string, QuotaRecord>();

export function getQuota(ip: string): QuotaRecord {
  const now = Date.now();
  let record = tokenQuotaMap.get(ip);
  if (!record || now > record.resetTime) {
    record = { usedTokens: 0, resetTime: now + RESET_WINDOW_MS };
    tokenQuotaMap.set(ip, record);
  }
  return record;
}

export function updateQuota(ip: string, tokensUsed: number): QuotaRecord {
  const record = getQuota(ip);
  record.usedTokens += tokensUsed;
  tokenQuotaMap.set(ip, record);
  return record;
}
