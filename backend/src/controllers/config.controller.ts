import { Request, Response } from 'express';
import { ApplicationConfig } from '../models';
import { GeminiService } from '../services';
import { AllRolePermissions, ModelConfig, CompanyInfo, SmtpConfig, ApiResponse } from '../types';

export const getPermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await ApplicationConfig.findOne({});
    if (!config) {
      res.status(404).json({});
      return;
    }

    res.json(config.permissions);
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({});
  }
};

export const updatePermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const permissions: AllRolePermissions = req.body;

    let config = await ApplicationConfig.findOne({});
    if (!config) {
      config = new ApplicationConfig({ permissions });
    } else {
      config.permissions = permissions;
    }

    await config.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getModelConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await ApplicationConfig.findOne({});
    if (!config) {
      res.status(404).json({});
      return;
    }

    res.json(config.modelConfig);
  } catch (error) {
    console.error('Get model config error:', error);
    res.status(500).json({});
  }
};

export const updateModelConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const modelConfig: ModelConfig = req.body;

    let config = await ApplicationConfig.findOne({});
    if (!config) {
      config = new ApplicationConfig({ modelConfig });
    } else {
      config.modelConfig = modelConfig;
    }

    await config.save();
    await GeminiService.updateConfiguration();

    res.json({ success: true });
  } catch (error) {
    console.error('Update model config error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getCompanyInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await ApplicationConfig.findOne({});
    if (!config) {
      res.status(404).json({});
      return;
    }

    res.json(config.companyInfo);
  } catch (error) {
    console.error('Get company info error:', error);
    res.status(500).json({});
  }
};

export const updateCompanyInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyInfo: CompanyInfo = req.body;

    let config = await ApplicationConfig.findOne({});
    if (!config) {
      config = new ApplicationConfig({ companyInfo });
    } else {
      config.companyInfo = companyInfo;
    }

    await config.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Update company info error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getSmtpConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await ApplicationConfig.findOne({});
    if (!config) {
      res.status(404).json({
        success: false,
        message: 'Configuration not found'
      } as ApiResponse);
      return;
    }

    const smtpConfigWithoutPassword = { ...config.smtpConfig };
    delete (smtpConfigWithoutPassword as any).password;

    res.json({
      success: true,
      data: smtpConfigWithoutPassword
    } as ApiResponse);
  } catch (error) {
    console.error('Get SMTP config error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ApiResponse);
  }
};

export const updateSmtpConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const smtpConfig: SmtpConfig = req.body;

    let config = await ApplicationConfig.findOne({});
    if (!config) {
      config = new ApplicationConfig({ smtpConfig });
    } else {
      config.smtpConfig = smtpConfig;
    }

    await config.save();

    const responseConfig = { ...config.smtpConfig };
    delete (responseConfig as any).password;

    res.json({
      success: true,
      data: responseConfig,
      message: 'SMTP configuration updated successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Update SMTP config error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ApiResponse);
  }
};

export const getApiKeyStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await ApplicationConfig.findOne({});
    const isSet = !!config?.geminiApiKey;
    res.json(isSet);
  } catch (error) {
    console.error('Get API key status error:', error);
    res.json(false);
  }
};

export const updateApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { newKey }: { newKey: string } = req.body;

    if (!newKey) {
      res.status(400).json({ success: false, message: 'API key is required' });
      return;
    }

    let config = await ApplicationConfig.findOne({});
    if (!config) {
      config = new ApplicationConfig({ geminiApiKey: newKey });
    } else {
      config.geminiApiKey = newKey;
    }

    await config.save();
    await GeminiService.updateConfiguration();

    res.json({ success: true });
  } catch (error) {
    console.error('Update API key error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};