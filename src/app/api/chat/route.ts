import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

// 🔁 Retry function
async function callOpenAI(messages: any[], retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        response_format: { type: "json_object" },
      });
      return response.choices[0]?.message?.content || "";
    } catch (err) {
      console.log("Retry:", i + 1, err);

      if (i === retries - 1) throw err;

      await new Promise((res) => setTimeout(res, 1000 * (i + 1)));
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let messages = body.messages;

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

    let text = await callOpenAI([
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

    text = text.trim();

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

    return NextResponse.json({
      detectedLanguage: parsed.detectedLanguage || "Unknown",
      detectedTopic: parsed.detectedTopic || "General Knowledge",
      answer: parsed.answer,
    });
  } catch (error: any) {
    console.error("🔥 API ERROR:", error);

    return NextResponse.json({ error: "AI service error" }, { status: 500 });
  }
}