import { NextRequest, NextResponse } from "next/server";
import { getQuota, updateQuota, MAX_TOKENS_LOGGED_IN, MAX_TOKENS_ANONYMOUS } from "@/lib/quota";
import { generateChatStream } from "@/services/ai.service";

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

      const now = Date.now();
      const diffMs = Math.max(0, quota.resetTime - now);
      const diffMinutes = Math.ceil(diffMs / (1000 * 60));
      let durationStr = "";
      if (diffMinutes <= 1) {
        durationStr = "kurang dari 1 menit lagi";
      } else if (diffMinutes < 60) {
        durationStr = `sekitar ${diffMinutes} menit lagi`;
      } else {
        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        durationStr = mins > 0 ? `sekitar ${hours} jam ${mins} menit lagi` : `sekitar ${hours} jam lagi`;
      }

      const msg = uid 
        ? `Batas energi harian Anda (${maxTokens.toLocaleString('id-ID')} token) telah habis. Energi Anda akan di-reset penuh secara otomatis pada pukul ${timeStr} WIB (${durationStr}). Mohon menunggu hingga waktu reset tiba untuk melanjutkan percakapan.`
        : `Batas energi gratis tamu (${maxTokens.toLocaleString('id-ID')} token) telah habis. Silakan Masuk (Login) untuk mendapatkan kuota 50.000 token, atau tunggu energi di-reset pada pukul ${timeStr} WIB (${durationStr}).`;
        
      return NextResponse.json(
        { 
          error: msg,
          isQuotaExceeded: true,
          quota: {
            used: quota.usedTokens,
            max: maxTokens,
            percentage: 0,
            resetTime: quota.resetTime
          }
        },
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

    // 3. Delegate to AI Streaming Service
    const stream = await generateChatStream(messages);
    const encoder = new TextEncoder();
    let totalUsage = 0;
    let fullText = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          let buffer = "";
          let metadataParsed = false;
          let metadata = {
            detectedLanguage: "id",
            detectedTopic: "General",
            suggestedTitle: "Percakapan Baru"
          };

          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content || "";
            if (chunk.usage?.total_tokens) {
              totalUsage = chunk.usage.total_tokens;
            }

            if (!delta) continue;

            if (!metadataParsed) {
              buffer += delta;
              const endTagIndex = buffer.indexOf("-->");
              if (endTagIndex !== -1) {
                const metaTag = buffer.slice(0, endTagIndex + 3);
                const remainder = buffer.slice(endTagIndex + 3).replace(/^\n+/, "");
                const match = metaTag.match(/<!--METADATA:\s*({[\s\S]*?})\s*-->/);
                if (match) {
                  try {
                    const parsed = JSON.parse(match[1]);
                    metadata = {
                      detectedLanguage: parsed.language || "id",
                      detectedTopic: parsed.topic || "General",
                      suggestedTitle: parsed.title || "Percakapan Baru"
                    };
                  } catch (e) {
                    console.error("Failed to parse metadata JSON from stream:", e);
                  }
                }
                metadataParsed = true;
                if (remainder) {
                  fullText += remainder;
                  const data = JSON.stringify({ type: "chunk", text: remainder });
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                }
              } else if (buffer.length > 250) {
                // If model didn't output metadata tag within 250 chars, flush buffer as normal text
                metadataParsed = true;
                fullText += buffer;
                const data = JSON.stringify({ type: "chunk", text: buffer });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
            } else {
              fullText += delta;
              const data = JSON.stringify({ type: "chunk", text: delta });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // Fallback token calculation if stream didn't include usage
          if (!totalUsage) {
            totalUsage = Math.ceil((fullText.length + JSON.stringify(messages).length) / 4);
          }

          // 4. Update Quota
          const newQuota = await updateQuota(id, totalUsage);

          // 5. Send Completion Done Event with Dynamic Metadata
          const doneData = JSON.stringify({
            type: "done",
            usage: totalUsage,
            detectedLanguage: metadata.detectedLanguage,
            detectedTopic: metadata.detectedTopic,
            suggestedTitle: metadata.suggestedTitle,
            quota: {
              used: newQuota.usedTokens,
              max: maxTokens,
              percentage: Math.max(0, 100 - (newQuota.usedTokens / maxTokens * 100))
            }
          });
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
          controller.close();
        } catch (streamError: any) {
          console.error("Stream controller error:", streamError);
          const errData = JSON.stringify({
            type: "error",
            error: streamError?.message || "Gagal memproses stream"
          });
          controller.enqueue(encoder.encode(`data: ${errData}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      }
    });
  } catch (error: any) {
    console.error("🔥 API ERROR:", error);

    return NextResponse.json({ error: error?.message || "AI service error" }, { status: 500 });
  }
}