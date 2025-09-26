import { GoogleGenAI } from "@google/genai";
import type { ModelConfig } from '../types.ts';
import { GeminiServiceError } from './errors.ts';
import { getApiKey } from './apiService.ts'; // Import the function to get the key

// The client will be initialized on-demand
let ai: GoogleGenAI | null = null;

const getAiClient = async (): Promise<GoogleGenAI> => {
    const apiKey = await getApiKey();
    if (!apiKey) {
        throw new GeminiServiceError("The application is not configured with an API key.", 'API_KEY_MISSING');
    }
    if (!ai) {
         ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};


export const generateAnswer = async (
  question: string,
  knowledgeBase: string,
  config: ModelConfig,
): Promise<string> => {
  
  const client = await getAiClient();

  const systemInstruction = `You are an AI assistant named Atlas. Your primary task is to follow all instructions precisely and answer user questions based *exclusively* on the information provided in the knowledge base below.
Do not use any external information, personal opinions, or invent details. Your responses must be grounded in the provided text.

--- START OF CUSTOM INSTRUCTIONS ---
${config.customInstruction}
--- END OF CUSTOM INSTRUCTIONS ---

If the answer to a question cannot be found within the provided knowledge base, you MUST respond with the following exact phrase and nothing more: "I do not have enough information to answer that question. Please contact a member of our support staff for further assistance."

Do not try to guess or infer answers if the information is not present. If the user's question is conversational (e.g., "hello", "thank you"), you may respond politely and conversationally, but always adhere to your custom instructions.

Here is the knowledge base:
---
${knowledgeBase}
---
`;

  try {
    const response = await client.models.generateContent({
      model: config.model,
      contents: question,
      config: {
        systemInstruction: systemInstruction,
        temperature: config.temperature,
        topP: config.topP,
        topK: config.topK,
      }
    });
    
    const text = response.text;
    if (text === undefined || text === null || text.trim() === '') {
      const blockReason = response.candidates?.[0]?.finishReason;
      if (blockReason && blockReason !== 'STOP') {
        throw new GeminiServiceError(`Content was blocked. Reason: ${blockReason}`, 'CONTENT_BLOCKED');
      }
      throw new GeminiServiceError("Received an empty response from the model.", 'UNKNOWN');
    }
    return text;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Reset client if API key is invalid
    if (error.message?.includes('API key not valid')) {
       ai = null; // This will force re-initialization with a new key on next call
       throw new GeminiServiceError("The provided API key is invalid.", 'INVALID_API_KEY');
    }
    if (error instanceof GeminiServiceError) {
        throw error;
    }
    throw new GeminiServiceError(error.message || "An unknown error occurred while contacting the Gemini API.", 'UNKNOWN');
  }
};