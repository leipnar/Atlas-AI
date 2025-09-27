import { Request, Response } from 'express';
import { Conversation } from '../models';
import { GeminiService } from '../services';
import { ApiResponse, Message } from '../types';

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, conversationId } = req.body;

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      } as ApiResponse);
      return;
    }

    if (!message || typeof message !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Message is required'
      } as ApiResponse);
      return;
    }

    let conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user._id
    });

    if (!conversation) {
      conversation = new Conversation({
        userId: req.user._id,
        startTime: new Date(),
        messages: []
      });
    }

    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      sender: 'user',
      text: message,
      timestamp: new Date(),
      isError: false,
      feedback: null
    };

    conversation.messages.push(userMessage);

    try {
      const conversationHistory = conversation.messages.slice(-10).map(msg =>
        `${msg.sender}: ${msg.text}`
      );

      const aiResponse = await GeminiService.generateResponse(message, conversationHistory);

      const aiMessage: Message = {
        id: `msg_${Date.now()}_ai`,
        sender: 'atlas',
        text: aiResponse,
        timestamp: new Date(),
        isError: false,
        feedback: null
      };

      conversation.messages.push(aiMessage);

      await conversation.save();

      res.json({
        success: true,
        data: {
          userMessage,
          aiMessage,
          conversationId: conversation._id
        }
      } as ApiResponse);

    } catch (aiError) {
      console.error('AI generation error:', aiError);

      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        sender: 'atlas',
        text: 'I apologize, but I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
        isError: true,
        feedback: null
      };

      conversation.messages.push(errorMessage);
      await conversation.save();

      res.json({
        success: true,
        data: {
          userMessage,
          aiMessage: errorMessage,
          conversationId: conversation._id
        }
      } as ApiResponse);
    }

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ApiResponse);
  }
};