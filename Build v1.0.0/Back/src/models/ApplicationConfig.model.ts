import mongoose, { Schema, Document } from 'mongoose';
import { ApplicationConfig, AllRolePermissions, ModelConfig, CompanyInfo, SmtpConfig } from '../types';

export interface IApplicationConfig extends ApplicationConfig, Document {}

const RolePermissionsSchema = new Schema({
  canViewDashboard: { type: Boolean, default: false },
  canManageUsers: { type: Boolean, default: false },
  canManageKnowledgeBase: { type: Boolean, default: false },
  canViewChatLogs: { type: Boolean, default: false },
  canManageRoles: { type: Boolean, default: false },
  canConfigureModel: { type: Boolean, default: false },
  canManageCompanyInfo: { type: Boolean, default: false },
  canConfigureSmtp: { type: Boolean, default: false }
}, { _id: false });

const AllRolePermissionsSchema = new Schema({
  admin: RolePermissionsSchema,
  manager: RolePermissionsSchema,
  supervisor: RolePermissionsSchema,
  support: RolePermissionsSchema,
  client: RolePermissionsSchema
}, { _id: false });

const ModelConfigSchema = new Schema({
  model: { type: String, default: 'gemini-2.5-flash', enum: ['gemini-2.5-flash', 'gpt-4o', 'llama3-70b'] },
  customInstruction: { type: String, default: 'You are Atlas, a helpful AI assistant.' },
  temperature: { type: Number, default: 0.7, min: 0, max: 2 },
  topP: { type: Number, default: 0.8, min: 0, max: 1 },
  topK: { type: Number, default: 40, min: 1, max: 100 }
}, { _id: false });

const CompanyInfoLocaleSchema = new Schema({
  name: { type: String, required: true },
  about: { type: String, required: true }
}, { _id: false });

const CompanyInfoSchema = new Schema({
  en: { type: CompanyInfoLocaleSchema, required: true },
  fa: { type: CompanyInfoLocaleSchema, required: true },
  logo: { type: String, default: null }
}, { _id: false });

const SmtpConfigSchema = new Schema({
  host: { type: String, default: '' },
  port: { type: Number, default: 587 },
  secure: { type: Boolean, default: false },
  username: { type: String, default: '' },
  password: { type: String, default: '' },
  fromEmail: { type: String, default: '' },
  fromName: { type: String, default: 'Atlas AI Support' }
}, { _id: false });

const ApplicationConfigSchema: Schema = new Schema({
  permissions: {
    type: AllRolePermissionsSchema,
    default: {
      admin: {
        canViewDashboard: true,
        canManageUsers: true,
        canManageKnowledgeBase: true,
        canViewChatLogs: true,
        canManageRoles: true,
        canConfigureModel: true,
        canManageCompanyInfo: true,
        canConfigureSmtp: true
      },
      manager: {
        canViewDashboard: true,
        canManageUsers: true,
        canManageKnowledgeBase: true,
        canViewChatLogs: true,
        canManageRoles: false,
        canConfigureModel: false,
        canManageCompanyInfo: false,
        canConfigureSmtp: false
      },
      supervisor: {
        canViewDashboard: true,
        canManageUsers: false,
        canManageKnowledgeBase: true,
        canViewChatLogs: true,
        canManageRoles: false,
        canConfigureModel: false,
        canManageCompanyInfo: false,
        canConfigureSmtp: false
      },
      support: {
        canViewDashboard: true,
        canManageUsers: true,
        canManageKnowledgeBase: true,
        canViewChatLogs: false,
        canManageRoles: false,
        canConfigureModel: false,
        canManageCompanyInfo: false,
        canConfigureSmtp: false
      },
      client: {
        canViewDashboard: false,
        canManageUsers: false,
        canManageKnowledgeBase: false,
        canViewChatLogs: false,
        canManageRoles: false,
        canConfigureModel: false,
        canManageCompanyInfo: false,
        canConfigureSmtp: false
      }
    }
  },
  modelConfig: {
    type: ModelConfigSchema,
    default: {}
  },
  companyInfo: {
    type: CompanyInfoSchema,
    default: {
      en: {
        name: "Atlas AI",
        about: "An intelligent AI support assistant that answers questions based on a provided knowledge base, ensuring responses are accurate and contextually grounded."
      },
      fa: {
        name: "هوش مصنوعی اطلس",
        about: "یک دستیار پشتیبانی هوشمند مبتنی بر هوش مصنوعی که به سوالات بر اساس پایگاه دانش ارائه شده پاسخ می‌دهد و از صحت و مبتنی بر زمینه بودن پاسخ‌ها اطمینان حاصل می‌کند."
      },
      logo: null
    }
  },
  smtpConfig: {
    type: SmtpConfigSchema,
    default: {}
  },
  geminiApiKey: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model<IApplicationConfig>('ApplicationConfig', ApplicationConfigSchema);