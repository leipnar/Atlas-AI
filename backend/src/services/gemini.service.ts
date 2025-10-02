import { GoogleGenerativeAI } from '@google/generative-ai';
import { ApplicationConfig, KnowledgeBase } from '../models';
import { ModelConfig } from '../types';

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private modelConfig: ModelConfig | null = null;

  async initialize(): Promise<void> {
    try {
      const config = await ApplicationConfig.findOne({});
      if (!config || !config.geminiApiKey) {
        throw new Error('Gemini API key not configured');
      }

      this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
      this.modelConfig = config.modelConfig;
    } catch (error) {
      console.error('Failed to initialize Gemini service:', error);
      throw error;
    }
  }

  async generateResponse(userMessage: string, conversationHistory: string[] = []): Promise<string> {
    if (!this.genAI || !this.modelConfig) {
      await this.initialize();
    }

    if (!this.genAI || !this.modelConfig) {
      throw new Error('Gemini service not properly initialized');
    }

    try {
      const knowledgeEntries = await KnowledgeBase.find({});
      const knowledgeContext = knowledgeEntries
        .map(entry => `${entry.tag}: ${entry.content}`)
        .join('\n\n');

      const model = this.genAI.getGenerativeModel({ model: this.modelConfig.model });

      const systemPrompt = `You are Atlas, an AI support assistant. Use the following knowledge base to answer user questions accurately and helpfully.

Knowledge Base:
${knowledgeContext}

Conversation History:
${conversationHistory.join('\n')}

Instructions:
- Always respond as Atlas, the AI support assistant
- Use the knowledge base to provide accurate information
- If you don't know something, say so clearly
- Be helpful, professional, and concise
- Consider the conversation history for context

User Question: ${userMessage}`;

      const result = await model.generateContent(systemPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating Gemini response:', error);
      throw new Error('Failed to generate response');
    }
  }

  async updateConfiguration(): Promise<void> {
    await this.initialize();
  }
}

export default new GeminiService();