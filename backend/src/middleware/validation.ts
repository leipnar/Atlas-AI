import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiResponse } from '../types';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);

    if (error) {
      const message = error.details.map(detail => detail.message).join(', ');
      res.status(400).json({
        success: false,
        message
      } as ApiResponse);
      return;
    }

    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.query);

    if (error) {
      const message = error.details.map(detail => detail.message).join(', ');
      res.status(400).json({
        success: false,
        message
      } as ApiResponse);
      return;
    }

    next();
  };
};

export const loginSchema = Joi.object({
  username: Joi.string().required().min(3).max(30),
  password: Joi.string().required().min(6)
});

export const userSchema = Joi.object({
  username: Joi.string().required().min(3).max(30),
  password: Joi.string().required().min(6),
  firstName: Joi.string().optional().max(50),
  lastName: Joi.string().optional().max(50),
  email: Joi.string().email().required(),
  mobile: Joi.string().optional().pattern(/^[\+]?[1-9][\d]{0,15}$/),
  role: Joi.string().valid('admin', 'manager', 'supervisor', 'support', 'client').required()
});

export const updateUserSchema = Joi.object({
  firstName: Joi.string().optional().max(50),
  lastName: Joi.string().optional().max(50),
  email: Joi.string().email().optional(),
  mobile: Joi.string().optional().pattern(/^[\+]?[1-9][\d]{0,15}$/),
  role: Joi.string().valid('admin', 'manager', 'supervisor', 'support', 'client').optional()
});

export const passwordUpdateSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().required().min(6)
});

export const knowledgeEntrySchema = Joi.object({
  tag: Joi.string().required().max(100),
  content: Joi.string().required().max(10000)
});

export const feedbackSchema = Joi.object({
  messageId: Joi.string().required(),
  feedback: Joi.string().valid('good', 'bad').required()
});

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional(),
  role: Joi.string().valid('admin', 'manager', 'supervisor', 'support', 'client').optional()
});