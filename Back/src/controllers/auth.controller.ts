import { Request, Response } from 'express';
import { AuthService } from '../services';
import { LoginRequest, ApiResponse, UserDocument } from '../types';
import { transformUser } from '../utils/transform';

declare global {
  namespace Express {
    interface Session {
      userId?: string;
    }
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password }: LoginRequest = req.body;

    const result = await AuthService.login(username, password);

    if (result.success && result.user) {
      req.session.userId = result.user._id;

      await AuthService.updateLastLogin(
        result.user._id,
        req.ip || 'unknown',
        req.get('User-Agent') || 'unknown'
      );

      const transformedUser = transformUser(result.user as any as UserDocument);
      res.json({ success: true, user: transformedUser });
    } else {
      res.json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('Login controller error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        res.status(500).json({
          success: false,
          message: 'Logout failed'
        } as ApiResponse);
        return;
      }

      res.clearCookie('atlas.session');
      res.json({ success: true });
    });
  } catch (error) {
    console.error('Logout controller error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(null);
      return;
    }

    res.json(req.user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json(null);
  }
};

export const registerPasskey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.body;

    // Simulate passkey registration
    console.log(`Simulating passkey registration for ${username}`);

    // In a real implementation, you would:
    // 1. Generate WebAuthn challenge
    // 2. Store challenge in session/database
    // 3. Return challenge to frontend
    // 4. Frontend uses WebAuthn API to create credential
    // 5. Frontend sends credential back to server
    // 6. Server verifies and stores credential

    res.json({ success: true, message: 'Passkey registration simulated successfully' });
  } catch (error) {
    console.error('Register passkey error:', error);
    res.json({ success: false, message: 'Passkey registration failed' });
  }
};

export const loginWithPasskey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.body;

    const result = await AuthService.login(username, 'passkey-auth');

    if (result.success && result.user) {
      req.session.userId = result.user._id;
      console.log(`Simulating passkey login for ${username}`);
      res.json({ success: true, user: result.user });
    } else {
      res.json({ success: false, message: 'User not found for passkey login.' });
    }
  } catch (error) {
    console.error('Login with passkey error:', error);
    res.json({ success: false, message: 'Passkey login failed' });
  }
};