import { Request, Response, NextFunction } from 'express';
import { ApplicationConfig } from '../models';
import { RolePermissions, ApiResponse } from '../types';

export const hasPermission = (permission: keyof RolePermissions) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        } as ApiResponse);
        return;
      }

      const config = await ApplicationConfig.findOne({});
      if (!config) {
        res.status(500).json({
          success: false,
          message: 'System configuration not found'
        } as ApiResponse);
        return;
      }

      const userRole = req.user.role;
      const rolePermissions = config.permissions[userRole];

      if (!rolePermissions || !rolePermissions[permission]) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        } as ApiResponse);
        return;
      }

      next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      } as ApiResponse);
    }
  };
};

export const isOwnerOrHasPermission = (permission: keyof RolePermissions, paramName = 'username') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        } as ApiResponse);
        return;
      }

      const targetUsername = req.params[paramName];
      if (req.user.username === targetUsername) {
        next();
        return;
      }

      const config = await ApplicationConfig.findOne({});
      if (!config) {
        res.status(500).json({
          success: false,
          message: 'System configuration not found'
        } as ApiResponse);
        return;
      }

      const userRole = req.user.role;
      const rolePermissions = config.permissions[userRole];

      if (!rolePermissions || !rolePermissions[permission]) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        } as ApiResponse);
        return;
      }

      next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      } as ApiResponse);
    }
  };
};