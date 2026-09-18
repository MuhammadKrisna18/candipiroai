import { openai } from "@/lib/openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

export interface AIResponse {
  detectedLanguage: string;
  detectedTopic: string;
  suggestedTitle: string;
  answer: string;
  usage: number;
}

const AIResponseSchema = z.object({
  detectedLanguage: z.string(),
  detectedTopic: z.string(),
  suggestedTitle: z.string().describe("A short, 3-5 word title summarizing the user's question or the conversation topic."),
  answer: z.string(),
});

const SYSTEM_PROMPT = `You are a highly intelligent, multilingual AI assistant. You possess extensive, accurate, and objective knowledge about various world religions and belief systems. When asked about religious topics, you must answer with deep understanding, neutrality, and profound respect for all beliefs.

Your primary function is to provide comprehensive, contextually relevant answers to the user's questions.

OUTPUT STRUCTURE REQUIREMENTS:
For detailed explanations, you MUST structure your answer into 3 main sections:
1. Introduction: A concise 1-2 sentence summary.
2. Key Points: Detailed explanations formatted exclusively as Bullet Points for readability.
3. Conclusion: A brief closing statement.

CONTENT & TONE GUIDELINES:
- Tone: Professional, academic, formal, and authoritative.
- Emojis: DO NOT use any emojis.
- Citations: When discussing religious or historical topics, you MUST explicitly cite specific scriptures, books, chapters, or verses (e.g., Quran, Bible, Vedas, historical texts) accurately.
- Emphasis: Use **bold** text strictly for highlighting critical keywords, not for entire sentences.

FORMATTING RULES FOR "answer":
1. Use clean and structured Markdown (headings, bullet points, bold text).
2. Separate paragraphs with double newlines.
3. Code blocks MUST include the language identifier.
4. Math MUST be written in valid LaTeX (inline: $...$, block: $$...$$).`;

async function callOpenAIApi(messages: any[], retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        response_format: zodResponseFormat(AIResponseSchema, "ai_response"),
      });
      return {
        text: response.choices[0]?.message?.content || "",
        usage: response.usage?.total_tokens || 0
      };
    } catch (err) {
      console.log("OpenAI Error Retry:", i + 1, err);
      if (i === retries - 1) throw err;
      await new Promise((res) => setTimeout(res, 1000 * (i + 1)));
    }
  }
  return { text: "", usage: 0 };
}

export async function generateChatResponse(userMessages: any[]): Promise<AIResponse> {
  // 1. Token Budget Control (Limit History Length)
  let messages = [...userMessages];
  if (messages.length > 10) {
    messages = messages.slice(-10);
  }

  // 2. Message Length Validation (Truncate overly long messages)
  const MAX_LENGTH = 2000;
  messages = messages.map((m: any) => ({
    ...m,
    content: typeof m.content === "string" && m.content.length > MAX_LENGTH 
      ? m.content.substring(0, MAX_LENGTH) + "... [terpotong]" 
      : m.content
  }));

  // 3. Assemble Final Messages
  const finalMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m: any) => ({
      role: m.role || "user",
      content: m.content || "",
    }))
  ];

  // 4. Call API
  const result = await callOpenAIApi(finalMessages);

  // 5. Parse Output
  let parsed;
  try {
    parsed = JSON.parse(result.text);
  } catch (err) {
    console.error("JSON parse failed in AI Service:", result.text);
    parsed = {
      detectedLanguage: "Unknown",
      detectedTopic: "General",
      suggestedTitle: "New Conversation",
      answer: result.text,
    };
  }

  return {
    detectedLanguage: parsed.detectedLanguage || "Unknown",
    detectedTopic: parsed.detectedTopic || "General Knowledge",
    suggestedTitle: parsed.suggestedTitle || "New Conversation",
    answer: parsed.answer,
    usage: result.usage,
  };
}
