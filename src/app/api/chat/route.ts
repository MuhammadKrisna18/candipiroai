import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

// 🔁 Retry function
async function callOpenAI(messages: any[], retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await openai.responses.create({
        model: "gpt-4o-mini",
        input: messages
          .map((m) => `${m.role.toUpperCase()}:\n${m.content}`)
          .join("\n\n"),
        text: {
          format: {
            type: "json_object",
          },
        },
      });
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

    const completion = await callOpenAI([
      {
        role: "system",
        content: `
You are a bilingual AI assistant.

You MUST return ONLY valid JSON.

Format:
{
  "detectedLanguage": "Indonesian | English",
  "detectedTopic": "Physics | Mathematics | General Knowledge",
  "answer": "string with markdown formatting"
}

Strict rules:
- MUST be valid JSON
- NO text outside JSON
- DO NOT wrap JSON in markdown


Rules for answer:
- Use markdown
- Use multiple paragraphs (\n\n)
- Use headings (###)
- Use bullet points (-)
- Use **bold**

MATH STRICT RULES:
- ALL math MUST be valid LaTeX
- Inline math: $...$
- Block math: $$...$$
- ALWAYS use correct LaTeX
- NEVER output invalid LaTeX

You are a highly intelligent and multilingual General AI assistant.
Answer the following conversation.
FORMAT RULES:
- Always format your answers cleanly using Markdown.
- Use code blocks or math blocks when appropriate.
`,
      },
      ...messages.map((m: any) => ({
        role: m.role || "user",
        content: m.content || "",
      })),
    ]);

    let text = completion?.output_text || "";
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

    // 🔥 AUTO FIX LATEX ERROR (SAFE VERSION)
    if (parsed.answer) {
      parsed.answer = parsed.answer

        .replace(/(?<!\\)ext\{/g, "\\text{")
        .replace(/\brac\b/g, "\\frac")
        .replace(/=\s*_s/g, "= \\mu_s")
        .replace(/=\s*_k/g, "= \\mu_k")
        .replace(/\\imes/g, "\\cdot")
        .replace(/imes/g, "\\cdot")
        .replace(/mimes/g, "\\cdot")
        .replace(/,(\d+)/g, ".$1");
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