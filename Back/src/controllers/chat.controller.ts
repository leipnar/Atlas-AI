import { Request, Response } from 'express';
import { Conversation } from '../models';
import { FeedbackRequest, ApiResponse } from '../types';

export const submitFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messageId, feedback }: FeedbackRequest = req.body;

    const conversation = await Conversation.findOne({
      'messages.id': messageId
    });

    if (!conversation) {
      res.json({ success: false, message: 'Message not found' });
      return;
    }

    const message = conversation.messages.find(msg => msg.id === messageId);
    if (message) {
      message.feedback = feedback;
      await conversation.save();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};