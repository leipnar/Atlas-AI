import { Request, Response } from 'express';
import { Conversation, User } from '../models';
import { PaginatedResponse, ApiResponse, ConversationDocument, UserDocument, ConversationSummary } from '../types';
import { transformConversationSummary, transformConversation, transformUserCredentials, LogsResponse } from '../utils/transform';

export const getConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    let query: any = {};

    if (search) {
      query.$or = [
        { 'messages.text': { $regex: search, $options: 'i' } }
      ];
    }

    const [conversationDocs, total] = await Promise.all([
      Conversation.find(query)
        .populate('userId')
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(limit),
      Conversation.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    const logs: ConversationSummary[] = await Promise.all(
      conversationDocs.map(async (convDoc) => {
        const userDoc = convDoc.userId as any as UserDocument;
        const userCredentials = transformUserCredentials(userDoc);
        return transformConversationSummary(convDoc as any as ConversationDocument, userCredentials);
      })
    );

    const response: LogsResponse = {
      logs,
      totalPages
    };

    res.json(response);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ApiResponse);
  }
};

export const getConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const conversationDoc = await Conversation.findById(id).populate('userId');

    if (!conversationDoc) {
      res.status(404).json(null);
      return;
    }

    const userDoc = conversationDoc.userId as any as UserDocument;
    const userCredentials = transformUserCredentials(userDoc);
    const conversation = transformConversation(conversationDoc as any as ConversationDocument, userCredentials);

    res.json(conversation);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json(null);
  }
};