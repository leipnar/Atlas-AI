import { GoogleGenAI } from "@google/genai";
import type { ModelConfig, ApiKeys } from '../types.ts';
import { GeminiServiceError } from './errors.ts';
import * as api from './apiService.ts';

// --- Google Gemini Handler ---
let googleAi: GoogleGenAI | null = null;
const getGoogleAiClient = (apiKey: string): GoogleGenAI => {
    if (!googleAi) {
        googleAi = new GoogleGenAI({ apiKey });
    }
    return googleAi;
};

const generateWithGoogle = async (
  question: string,
  knowledgeBase: string,
  config: ModelConfig,
  aiName: string,
  apiKey: string
): Promise<string> => {
  if (!apiKey) {
    throw new GeminiServiceError("Google API key is not configured.", 'API_KEY_MISSING');
  }

  try {
    const client = getGoogleAiClient(apiKey);
    const systemInstruction = `You are an AI assistant named ${aiName}. Your primary task is to follow all instructions precisely and answer user questions based *exclusively* on the information provided in the knowledge base below.
Do not use any external information, personal opinions, or invent details. Your responses must be grounded in the provided text.
--- START OF CUSTOM INSTRUCTIONS ---
${config.customInstruction}
--- END OF CUSTOM INSTRUCTIONS ---
If the answer to a question cannot be found within the provided knowledge base, you MUST respond with the following exact phrase and nothing more: "I do not have enough information to answer that question. Please contact a member of our support staff for further assistance."
Do not try to guess or infer answers if the information is not present. If the user's question is conversational (e.g., "hello", "thank you"), you may respond politely and conversationally, but always adhere to your custom instructions.
Here is the knowledge base:
---
${knowledgeBase}
---`;

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
    console.error("Google Gemini API Error:", error);
    if (error.message?.includes('API key not valid')) {
       googleAi = null; // Force re-initialization on next call
       throw new GeminiServiceError("The provided Google API key is invalid.", 'INVALID_API_KEY');
    }
    if (error instanceof GeminiServiceError) throw error;
    throw new GeminiServiceError(error.message || "An unknown error occurred with the Gemini API.", 'UNKNOWN');
  }
};

// --- OpenAI Handler (Mock) ---
const generateWithOpenAI = async (
  question: string,
  knowledgeBase: string,
  config: ModelConfig,
  aiName: string,
  apiKey: string
): Promise<string> => {
  if (!apiKey) {
    throw new GeminiServiceError("OpenAI API key is not configured.", 'API_KEY_MISSING');
  }
  console.log("Simulating call to OpenAI with model:", config.model);
  // In a real app, you would use the OpenAI SDK here.
  return `[Mock response from OpenAI/${config.model}] I am ${aiName}. You asked: "${question}"`;
};

// --- OpenRouter Handler (Mock) ---
const generateWithOpenRouter = async (
  question: string,
  knowledgeBase: string,
  config: ModelConfig,
  aiName: string,
  apiKey: string
): Promise<string> => {
  if (!apiKey) {
    throw new GeminiServiceError("OpenRouter API key is not configured.", 'API_KEY_MISSING');
  }
  console.log("Simulating call to OpenRouter with model:", config.model);
  // In a real app, you would make a fetch request to the OpenRouter API.
  return `[Mock response from OpenRouter/${config.model}] I am ${aiName}. You asked: "${question}"`;
};


// --- Main Dispatcher Function ---
export const generateAnswer = async (
  question: string,
  knowledgeBase: string,
  config: ModelConfig,
  aiName: string,
): Promise<string> => {
  
  const apiKeys = await api.getApiKeys();

  switch (config.provider) {
    case 'google':
      return generateWithGoogle(question, knowledgeBase, config, aiName, apiKeys.google);
    case 'openai':
      return generateWithOpenAI(question, knowledgeBase, config, aiName, apiKeys.openai);
    case 'openrouter':
      return generateWithOpenRouter(question, knowledgeBase, config, aiName, apiKeys.openrouter);
    default:
      // This is a failsafe, but the UI should prevent this state.
      // Using type assertion to handle cases where provider might be an unexpected string.
      const exhaustiveCheck: never = config.provider;
      throw new GeminiServiceError(`Unsupported model provider: ${exhaustiveCheck}`, 'BAD_REQUEST');
  }
};