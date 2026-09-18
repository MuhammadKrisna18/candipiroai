import { openai } from "@/lib/openai";

export interface AIResponse {
  detectedLanguage: string;
  detectedTopic: string;
  answer: string;
  usage: number;
}

const SYSTEM_PROMPT = `You are a highly intelligent, multilingual AI assistant. You possess extensive, accurate, and objective knowledge about various world religions and belief systems. When asked about religious topics, you must answer with deep understanding, neutrality, and profound respect for all beliefs.

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
4. Math MUST be written in valid LaTeX (inline: $...$, block: $$...$$).`;

async function callOpenAIApi(messages: any[], retries = 3) {
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
  let text = result.text.trim();
  
  // Clean markdown JSON wrapper if exists
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    console.error("JSON parse failed in AI Service:", text);
    parsed = {
      detectedLanguage: "Unknown",
      detectedTopic: "General",
      answer: text,
    };
  }

  if (typeof parsed.answer !== "string") {
    parsed.answer = JSON.stringify(parsed.answer, null, 2);
  }

  return {
    detectedLanguage: parsed.detectedLanguage || "Unknown",
    detectedTopic: parsed.detectedTopic || "General Knowledge",
    answer: parsed.answer,
    usage: result.usage,
  };
}
