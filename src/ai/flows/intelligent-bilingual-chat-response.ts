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
  question: z.string().describe('The user\'s question, which can be in Indonesian or English, covering physics (especially friction) or general knowledge.'),
});
export type IntelligentBilingualChatResponseInput = z.infer<typeof IntelligentBilingualChatResponseInputSchema>;

const IntelligentBilingualChatResponseOutputSchema = z.object({
  detectedLanguage: z.enum(['Indonesian', 'English']).describe('The detected language of the user\'s question. Must be either "Indonesian" or "English".'),
  detectedTopic: z.enum(['Physics', 'General Knowledge']).describe('The detected topic of the user\'s question. Must be either "Physics" or "General Knowledge".'),
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
  prompt: `You are a highly intelligent and multilingual AI assistant specializing in physics (especially friction) and general knowledge.

Your task is to analyze a user's question, determine its language (Indonesian or English), identify its topic (Physics or General Knowledge), and then provide a comprehensive, contextually relevant, and language-appropriate answer.

Focus on providing detailed physics explanations when the topic is physics, especially concerning friction. For general knowledge, provide accurate and informative answers.

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
    const maxAttempts = 3;
    
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
        const isTransient = 
          error.message?.includes('503') || 
          error.message?.includes('Service Unavailable') || 
          error.message?.includes('high demand') ||
          error.message?.includes('UNAVAILABLE');
        
        if (attempts >= maxAttempts || !isTransient) {
          throw error;
        }
        
        // Wait before retrying: 2s, 4s, etc.
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
      }
    }
    throw new Error('Service is currently unavailable after multiple retries. Please try again in a few moments.');
  }
);
