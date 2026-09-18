import { NextRequest, NextResponse } from "next/server";
import { getQuota, MAX_TOKENS_LOGGED_IN, MAX_TOKENS_ANONYMOUS } from "@/lib/quota";

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid");
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  
  const id = uid ? `uid_${uid}` : `ip_${ip}`;
  const maxTokens = id.includes(".") || id.includes(":") ? MAX_TOKENS_ANONYMOUS : MAX_TOKENS_LOGGED_IN;
  const currentQuota = await getQuota(id);

  return NextResponse.json({
    percentage: Math.max(0, 100 - (currentQuota.usedTokens / maxTokens * 100)),
    used: currentQuota.usedTokens,
    max: maxTokens,
    resetTime: currentQuota.resetTime
  });
}
