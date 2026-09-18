import { NextRequest, NextResponse } from "next/server";
import { getQuota, MAX_TOKENS_LOGGED_IN, MAX_TOKENS_ANONYMOUS } from "@/lib/quota";

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid");
  const ip = req.headers.get("x-forwarded-for") || req.ip || "unknown";
  
  const id = uid ? `uid_${uid}` : `ip_${ip}`;
  const maxTokens = uid ? MAX_TOKENS_LOGGED_IN : MAX_TOKENS_ANONYMOUS;

  const quota = getQuota(id);
  
  return NextResponse.json({
    used: quota.usedTokens,
    max: maxTokens,
    percentage: Math.max(0, 100 - (quota.usedTokens / maxTokens * 100)),
    resetTime: quota.resetTime
  });
}
