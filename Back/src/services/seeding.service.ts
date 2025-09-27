import { User, KnowledgeBase, ApplicationConfig } from '../models';
import { AuthService } from './auth.service';

class SeedingService {
  async seedDatabase(): Promise<void> {
    try {
      console.log('🌱 Starting database seeding...');

      // Check if already seeded
      const existingUser = await User.findOne({ username: 'admin' });
      if (existingUser) {
        console.log('✅ Database already seeded');
        return;
      }

      // Seed initial users
      await this.seedUsers();

      // Seed initial knowledge base
      await this.seedKnowledgeBase();

      // Seed application config
      await this.seedApplicationConfig();

      console.log('✅ Database seeding completed successfully');
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  private async seedUsers(): Promise<void> {
    const users = [
      {
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        email: 'admin@atlas.com',
        mobile: '555-0101',
        password: await AuthService.hashPassword('PassWD'),
        emailVerified: true
      },
      {
        username: 'manager',
        firstName: 'Manager',
        lastName: 'Person',
        role: 'manager',
        email: 'manager@atlas.com',
        mobile: '555-0102',
        password: await AuthService.hashPassword('PassWD'),
        emailVerified: true
      },
      {
        username: 'supervisor',
        firstName: 'Super',
        lastName: 'Visor',
        role: 'supervisor',
        email: 'super@atlas.com',
        mobile: '555-0103',
        password: await AuthService.hashPassword('PassWD'),
        emailVerified: true
      },
      {
        username: 'support',
        firstName: 'Support',
        lastName: 'Staff',
        role: 'support',
        email: 'support@atlas.com',
        mobile: '555-0104',
        password: await AuthService.hashPassword('PassWD'),
        emailVerified: false
      },
      {
        username: 'client',
        firstName: 'Client',
        lastName: 'Joe',
        role: 'client',
        email: 'client@atlas.com',
        mobile: '555-0105',
        password: await AuthService.hashPassword('PassWD'),
        emailVerified: true
      },
      {
        username: 'testuser',
        firstName: 'Test',
        lastName: 'Account',
        role: 'client',
        email: 'test@atlas.com',
        mobile: '555-0106',
        password: await AuthService.hashPassword('PassWD'),
        emailVerified: false
      }
    ];

    await User.insertMany(users);
    console.log('👥 Users seeded successfully');
  }

  private async seedKnowledgeBase(): Promise<void> {
    const knowledgeEntries = [
      {
        tag: 'Welcome',
        content: 'Welcome to Atlas! This is a default knowledge base. You can edit this text to provide Atlas with the information it needs to answer questions.',
        lastUpdated: new Date(),
        updatedBy: 'system'
      },
      {
        tag: 'What is Atlas?',
        content: "Atlas is an AI assistant designed to answer questions based on a specific set of information provided by administrators. It does not use external knowledge from the internet.",
        lastUpdated: new Date(),
        updatedBy: 'system'
      },
      {
        tag: 'How Atlas Works',
        content: "1. Administrators provide a knowledge base (like these entries).\\n2. Users ask questions in the chat interface.\\n3. Atlas uses its language model to find and formulate answers based *only* on the knowledge base.\\n4. If an answer isn't in the knowledge base, Atlas will say so.",
        lastUpdated: new Date(),
        updatedBy: 'system'
      }
    ];

    await KnowledgeBase.insertMany(knowledgeEntries);
    console.log('📚 Knowledge base seeded successfully');
  }

  private async seedApplicationConfig(): Promise<void> => {
    const config = new ApplicationConfig({
      permissions: {
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
          canManageRoles: true,
          canConfigureModel: true,
          canManageCompanyInfo: true,
          canConfigureSmtp: true
        },
        supervisor: {
          canViewDashboard: true,
          canManageUsers: true,
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
      },
      modelConfig: {
        model: 'gemini-2.5-flash',
        customInstruction: 'The assistant should be friendly, professional, and concise in its answers.',
        temperature: 0.2,
        topP: 0.8,
        topK: 40
      },
      companyInfo: {
        en: {
          name: "Atlas AI",
          about: "An intelligent AI support assistant that answers questions based on a provided knowledge base, ensuring responses are accurate and contextually grounded."
        },
        fa: {
          name: "هوش مصنوعی اطلس",
          about: "یک دستیار پشتیبانی هوشمند مبتنی بر هوش مصنوعی که به سوالات بر اساس پایگاه دانش ارائه شده پاسخ می‌دهد و از صحت و مبتنی بر زمینه بودن پاسخ‌ها اطمینان حاصل می‌کند."
        },
        logo: null
      },
      smtpConfig: {
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        username: 'user@example.com',
        password: '',
        fromEmail: 'noreply@atlas.com',
        fromName: 'Atlas AI Support'
      },
      geminiApiKey: ''
    });

    await config.save();
    console.log('⚙️ Application configuration seeded successfully');
  }
}

export default new SeedingService();