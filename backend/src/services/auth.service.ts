import bcrypt from 'bcrypt';
import { User } from '../models';
import { UserCredentials, LoginResponse } from '../types';

class AuthService {
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const user = await User.findOne({
        $or: [{ username }, { email: username }]
      });

      if (!user) {
        return { success: false, message: 'Invalid credentials' };
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid credentials' };
      }

      const userWithoutPassword: any = user.toObject();
      delete userWithoutPassword.password;

      return {
        success: true,
        user: {
          ...userWithoutPassword,
          _id: String(userWithoutPassword._id)
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed' };
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async updateLastLogin(userId: string, ip: string, userAgent: string): Promise<void> {
    try {
      const device = this.parseUserAgent(userAgent);

      await User.findByIdAndUpdate(userId, {
        lastLogin: {
          timestamp: new Date(),
          ip,
          device: device.browser,
          os: device.os
        }
      });
    } catch (error) {
      console.error('Update last login error:', error);
    }
  }

  private parseUserAgent(userAgent: string): { browser: string; os: string } {
    const browser = userAgent.includes('Chrome') ? 'Chrome' :
                   userAgent.includes('Firefox') ? 'Firefox' :
                   userAgent.includes('Safari') ? 'Safari' :
                   userAgent.includes('Edge') ? 'Edge' : 'Unknown';

    const os = userAgent.includes('Windows') ? 'Windows' :
               userAgent.includes('Mac') ? 'macOS' :
               userAgent.includes('Linux') ? 'Linux' :
               userAgent.includes('Android') ? 'Android' :
               userAgent.includes('iOS') ? 'iOS' : 'Unknown';

    return { browser, os };
  }
}

export default new AuthService();