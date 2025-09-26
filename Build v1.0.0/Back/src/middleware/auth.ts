import { Request, Response, NextFunction } from 'express';
import { User } from '../models';
import { ApiResponse, UserDocument } from '../types';
import { transformUser } from '../utils/transform';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.session || !req.session.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      } as ApiResponse);
      return;
    }

    const userDoc = await User.findById(req.session.userId);
    if (!userDoc) {
      req.session.destroy((err) => {
        if (err) console.error('Session destruction error:', err);
      });
      res.status(401).json({
        success: false,
        message: 'User not found'
      } as ApiResponse);
      return;
    }

    req.user = transformUser(userDoc as any as UserDocument);
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ApiResponse);
  }
};