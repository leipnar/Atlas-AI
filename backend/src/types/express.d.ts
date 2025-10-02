import { User } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }

    interface Session {
      userId?: string;
    }
  }
}