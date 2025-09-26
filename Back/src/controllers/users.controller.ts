import { Request, Response } from 'express';
import { User } from '../models';
import { AuthService } from '../services';
import { UserCredentials, UpdatePasswordRequest, PaginatedResponse, ApiResponse, UserDocument } from '../types';
import { transformUserCredentials, createPaginatedResponse, UsersResponse } from '../utils/transform';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const role = req.query.role as string;

    const skip = (page - 1) * limit;

    let query: any = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    const [userDocs, total] = await Promise.all([
      User.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);
    const users = userDocs.map(doc => transformUserCredentials(doc as any as UserDocument));

    const response: UsersResponse = {
      users,
      totalPages
    };

    res.json(response);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ApiResponse);
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userData: UserCredentials = req.body;

    const existingUser = await User.findOne({
      $or: [{ username: userData.username }, { email: userData.email }]
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      } as ApiResponse);
      return;
    }

    const hashedPassword = await AuthService.hashPassword(userData.password);

    const user = new User({
      ...userData,
      password: hashedPassword
    });

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: userResponse,
      message: 'User created successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ApiResponse);
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    const updateData = req.body;

    if (updateData.email) {
      const existingUser = await User.findOne({
        email: updateData.email,
        username: { $ne: username }
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'Email already exists'
        } as ApiResponse);
        return;
      }
    }

    const user = await User.findOneAndUpdate(
      { username },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ApiResponse);
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;

    const user = await User.findOneAndDelete({ username });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ApiResponse);
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    const newPassword = Math.random().toString(36).slice(-8);

    const hashedPassword = await AuthService.hashPassword(newPassword);

    const user = await User.findOneAndUpdate(
      { username },
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: { newPassword },
      message: 'Password reset successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ApiResponse);
  }
};

export const updatePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, oldPass, newPass } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      res.json({ success: false, message: 'User not found.' });
      return;
    }

    const result = await AuthService.login(username, oldPass);
    if (!result.success) {
      res.json({ success: false, message: 'Current password is incorrect.' });
      return;
    }

    const hashedPassword = await AuthService.hashPassword(newPass);
    await User.findOneAndUpdate({ username }, { password: hashedPassword });

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const resetUserPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    const { newPass } = req.body;

    const user = await User.findOneAndUpdate(
      { username },
      { password: await AuthService.hashPassword(newPass) },
      { new: true }
    );

    if (!user) {
      res.json({ success: false, message: 'User not found.' });
      return;
    }

    res.json({ success: true, message: `Password for ${username} has been reset.` });
  } catch (error) {
    console.error('Reset user password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const resendVerificationEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });
    if (!user) {
      res.json({ success: false, message: 'User not found.' });
      return;
    }

    // Simulate sending email
    console.log(`SIMULATION: Sent verification email to user ${username}.`);
    res.json({ success: true, message: `Verification email sent to ${username}.` });
  } catch (error) {
    console.error('Resend verification email error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};