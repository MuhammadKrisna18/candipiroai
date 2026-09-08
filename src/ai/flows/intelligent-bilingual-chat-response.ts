
'use server';
/**
 * @fileOverview This file implements a Genkit flow for an intelligent bilingual chatbot.
 * It detects the language (Indonesian or English) and topic (Physics or General Knowledge)
 * of a user's question and provides a comprehensive, language-appropriate answer.
 *
 * - intelligentBilingualChatResponse - The main function to call the AI chat response flow.
 * - IntelligentBilingualChatResponseInput - The input type for the flow.
 * - IntelligentBilingualChatResponseOutput - The output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const IntelligentBilingualChatResponseInputSchema = z.object({
  question: z.string().describe('The user\'s question, which can be in Indonesian or English.'),
});
export type IntelligentBilingualChatResponseInput = z.infer<typeof IntelligentBilingualChatResponseInputSchema>;

const IntelligentBilingualChatResponseOutputSchema = z.object({
  detectedLanguage: z.enum(['Indonesian', 'English']).describe('The detected language of the user\'s question. Must be either "Indonesian" or "English".'),
  detectedTopic: z.string().describe('A short 1-3 word description of the detected topic of the user\'s question.'),
  answer: z.string().describe('A comprehensive, contextually relevant, and language-appropriate answer to the user\'s question.'),
});
export type IntelligentBilingualChatResponseOutput = z.infer<typeof IntelligentBilingualChatResponseOutputSchema>;

export async function intelligentBilingualChatResponse(input: IntelligentBilingualChatResponseInput): Promise<IntelligentBilingualChatResponseOutput> {
  return intelligentBilingualChatResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentBilingualChatResponsePrompt',
  input: { schema: IntelligentBilingualChatResponseInputSchema },
  output: { schema: IntelligentBilingualChatResponseOutputSchema },
  prompt: `You are a highly intelligent and multilingual General AI assistant.

Your task is to analyze a user's question, determine its language (Indonesian or English), identify its general topic, and then provide a comprehensive, contextually relevant, and language-appropriate answer.

The output MUST be a JSON object matching the provided schema.

User's question: {{{question}}}`,
});

const intelligentBilingualChatResponseFlow = ai.defineFlow(
  {
    name: 'intelligentBilingualChatResponseFlow',
    inputSchema: IntelligentBilingualChatResponseInputSchema,
    outputSchema: IntelligentBilingualChatResponseOutputSchema,
  },
  async (input) => {
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      try {
        const { output } = await prompt(input);
        if (!output) {
          throw new Error('No output received from the prompt.');
        }
        return output;
      } catch (error: any) {
        attempts++;
        // Check if the error is a transient service error (503, high demand, etc.)
        const errorMessage = error?.message || String(error);
        const isTransient = 
          errorMessage.includes('503') || 
          errorMessage.includes('Service Unavailable') || 
          errorMessage.includes('high demand') ||
          errorMessage.includes('UNAVAILABLE') ||
          errorMessage.includes('DEADLINE_EXCEEDED');
        
        if (attempts >= maxAttempts || !isTransient) {
          throw error;
        }
        
        // Wait before retrying: 1s, 2s, 4s, 8s (exponential backoff)
        const delay = 1000 * Math.pow(2, attempts - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Service is currently unavailable after multiple retries. Please try again in a few moments.');
  }
);
