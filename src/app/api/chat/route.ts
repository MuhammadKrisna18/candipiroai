import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { getQuota, updateQuota, MAX_TOKENS_LOGGED_IN, MAX_TOKENS_ANONYMOUS } from "@/lib/quota";

// 🔁 Retry function
async function callOpenAI(messages: any[], retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        response_format: { type: "json_object" },
      });
      return {
        text: response.choices[0]?.message?.content || "",
        usage: response.usage?.total_tokens || 0
      };
    } catch (err) {
      console.log("Retry:", i + 1, err);

      if (i === retries - 1) throw err;

      await new Promise((res) => setTimeout(res, 1000 * (i + 1)));
    }
  }
  return { text: "", usage: 0 };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let messages = body.messages;
    const uid = body.uid;

    // 1. Quota Check
    const ip = req.headers.get("x-forwarded-for") || req.ip || "unknown";
    const id = uid ? `uid_${uid}` : `ip_${ip}`;
    const maxTokens = uid ? MAX_TOKENS_LOGGED_IN : MAX_TOKENS_ANONYMOUS;
    
    const quota = getQuota(id);
    
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

    // 3. Token Budget Control (Limit History Length)
    // Keep only the last 10 messages to prevent huge token usage
    if (messages.length > 10) {
      messages = messages.slice(-10);
    }

    // 4. Message Length Validation (Truncate overly long messages)
    const MAX_LENGTH = 2000;
    messages = messages.map((m: any) => ({
      ...m,
      content: typeof m.content === "string" && m.content.length > MAX_LENGTH 
        ? m.content.substring(0, MAX_LENGTH) + "... [terpotong]" 
        : m.content
    }));

    let result = await callOpenAI([
      {
        role: "system",
        content: `You are a highly intelligent, multilingual AI assistant.

Your primary function is to provide comprehensive, contextually relevant answers to the user's questions.

OUTPUT FORMAT:
You MUST respond with a raw JSON object only. Do NOT wrap the JSON in markdown blocks (e.g., no \`\`\`json).

{
  "detectedLanguage": "Indonesian | English | Other",
  "detectedTopic": "A short 1-3 word description of the topic (e.g., Programming, Science, History, General)",
  "answer": "Your detailed response formatted in Markdown"
}

FORMATTING RULES FOR "answer":
1. Use clean and structured Markdown (headings, bullet points, bold text).
2. Separate paragraphs with double newlines.
3. Code blocks MUST include the language identifier.
4. Math MUST be written in valid LaTeX (inline: $...$, block: $$...$$).`
      },
      ...messages.map((m: any) => ({
        role: m.role || "user",
        content: m.content || "",
      })),
    ]);

    let text = result.text.trim();

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.log("JSON parse failed:", text);

      parsed = {
        detectedLanguage: "Unknown",
        detectedTopic: "General",
        answer: text,
      };
    }



    if (typeof parsed.answer !== "string") {
      parsed.answer = JSON.stringify(parsed.answer, null, 2);
    }

    const newQuota = updateQuota(id, result.usage);

    return NextResponse.json({
      detectedLanguage: parsed.detectedLanguage || "Unknown",
      detectedTopic: parsed.detectedTopic || "General Knowledge",
      answer: parsed.answer,
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