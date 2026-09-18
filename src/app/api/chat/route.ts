import { NextRequest, NextResponse } from "next/server";
import { getQuota, updateQuota, MAX_TOKENS_LOGGED_IN, MAX_TOKENS_ANONYMOUS } from "@/lib/quota";
import { generateChatResponse } from "@/services/ai.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let messages = body.messages;
    const uid = body.uid;

    // 1. Quota Check
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const id = uid ? `uid_${uid}` : `ip_${ip}`;
    const maxTokens = uid ? MAX_TOKENS_LOGGED_IN : MAX_TOKENS_ANONYMOUS;
    
    const quota = await getQuota(id);
    
    if (quota.usedTokens >= maxTokens) {
      const resetDate = new Date(quota.resetTime);
      const timeStr = resetDate.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
      const msg = uid 
        ? `Batas energi (${maxTokens.toLocaleString('id-ID')} token) Anda sudah habis. Energi akan di-reset penuh pada pukul ${timeStr}.`
        : `Batas energi tamu (${maxTokens.toLocaleString('id-ID')} token) Anda sudah habis. Silakan Masuk (Login) untuk mendapatkan kuota 50.000 token, atau tunggu reset pada pukul ${timeStr}.`;
        
      return NextResponse.json(
        { error: msg },
        { status: 429 }
      );
    }

    // 2. Input Validation (Empty Check)
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      if (body.question && typeof body.question === "string") {
        messages = [{ role: "user", content: body.question }];
      } else {
        return NextResponse.json(
          { error: "No messages provided" },
          { status: 400 },
        );
      }
    }

    // 3. Delegate to AI Service
    const aiResult = await generateChatResponse(messages);

    // 4. Update Quota
    const newQuota = await updateQuota(id, aiResult.usage);

    // 5. Return HTTP Response
    return NextResponse.json({
      detectedLanguage: aiResult.detectedLanguage,
      detectedTopic: aiResult.detectedTopic,
      answer: aiResult.answer,
      quota: {
        used: newQuota.usedTokens,
        max: maxTokens,
        percentage: Math.max(0, 100 - (newQuota.usedTokens / maxTokens * 100))
      }
    });
  } catch (error: any) {
    console.error("🔥 API ERROR:", error);

    return NextResponse.json({ error: "AI service error" }, { status: 500 });
  }
}