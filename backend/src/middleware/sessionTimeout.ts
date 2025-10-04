import { Request, Response, NextFunction } from 'express';
import { SESSION_IDLE_TIMEOUT } from '../config/session';

declare module 'express-session' {
  interface SessionData {
    lastActivity?: number;
  }
}

export const sessionTimeout = (req: Request, res: Response, next: NextFunction): void => {
  const session = req.session as any;
  if (req.session && session.userId) {
    const now = Date.now();
    const lastActivity = req.session.lastActivity || now;
    
    if (now - lastActivity > SESSION_IDLE_TIMEOUT) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
      });
      
      res.status(401).json({
        success: false,
        message: 'Session expired due to inactivity. Please login again.'
      });
      return;
    }
    
    req.session.lastActivity = now;
  }
  
  next();
};
