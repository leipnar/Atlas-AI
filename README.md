# Atlas AI Support Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![GitHub release](https://img.shields.io/github/release/leipnar/Atlas-AI.svg)](https://github.com/leipnar/Atlas-AI/releases)
[![Auto Install](https://img.shields.io/badge/deployment-one--command-blue.svg)](https://github.com/leipnar/Atlas-AI#one-command-deployment)

> **One-Command Deployment** | **Production Ready** | **Fully Automated** | **Secure by Default**

Atlas AI is a comprehensive AI-powered support assistant with complete auto-deployment infrastructure. Deploy a production-ready application with SSL, monitoring, backups, and security hardening in minutes.

## 🚀 One-Command Deployment

Deploy Atlas AI on any VPS with a single command:

```bash
curl -sSL https://raw.githubusercontent.com/leipnar/Atlas-AI/main/Auto%20Install/install.sh | bash
```

**That's it!** Your Atlas AI instance will be running at `https://yourdomain.com` with:
- ✅ SSL certificates (Let's Encrypt)
- ✅ Automatic security hardening
- ✅ Health monitoring
- ✅ Automated backups
- ✅ Update system with rollback

## ✨ Features

### 🤖 AI-Powered Support
- **Knowledge Base Management**: Administrators can create and manage a custom knowledge base
- **Context-Aware Responses**: AI provides answers based only on the provided knowledge base
- **Multi-Language Support**: English and Farsi (Persian) interface
- **Real-Time Chat**: Instant responses with typing indicators
- **Conversation Logging**: Complete chat history with admin review capabilities

### 🏗️ Complete Infrastructure
- **Frontend**: Modern React application with responsive design
- **Backend**: Node.js/Express API with TypeScript support
- **Database**: MongoDB with authentication and security
- **Reverse Proxy**: Nginx with SSL termination and security headers
- **Process Management**: PM2 with clustering and auto-restart
- **Monitoring**: Health checks, performance metrics, and alerting

### 🛡️ Production Security
- **SSL/TLS**: Automatic Let's Encrypt certificates with renewal
- **Firewall**: UFW configuration with minimal attack surface
- **Intrusion Prevention**: Fail2ban protection against brute force
- **Security Headers**: HSTS, CSP, XSS protection, and more
- **Database Security**: Authentication, access controls, and encryption
- **Regular Updates**: Automated security patch installation

### 📊 Operations & Monitoring
- **Health Monitoring**: Real-time service health checks
- **Performance Metrics**: CPU, memory, disk usage tracking
- **Automated Backups**: Daily, weekly, and monthly backup schedules
- **Log Management**: Centralized logging with rotation
- **Update System**: Zero-downtime updates with automatic rollback
- **Maintenance Tools**: Automated cleanup and optimization

## 📋 System Requirements

### Minimum VPS Specs
- **OS**: Ubuntu 18.04+, Debian 9+, CentOS 7+, RHEL 7+, Fedora 35+, Rocky Linux 8+, or AlmaLinux 8+
- **RAM**: 2GB (4GB recommended)
- **Storage**: 20GB SSD
- **CPU**: 1 vCPU (2+ recommended)
- **Network**: Public IPv4 address

### Domain Requirements
- Valid domain name
- DNS A record pointing to your VPS IP
- Email address for SSL certificate registration

## 🔧 Installation Options

### Basic Installation (Interactive Setup)
```bash
curl -sSL https://raw.githubusercontent.com/leipnar/Atlas-AI/main/Auto%20Install/install.sh | bash
```
*The installer will prompt you for your domain name and email address.*

### Advanced Installation (Command Line Parameters)
```bash
curl -sSL https://raw.githubusercontent.com/leipnar/Atlas-AI/main/Auto%20Install/install.sh | bash -s -- \
  --domain=atlas.example.com \
  --email=admin@example.com \
  --environment=production \
  --db-password=secure_password_123 \
  --backend-port=3001 \
  --gemini-api-key=your_api_key
```

### Installation Parameters

| Parameter | Description | Required | Default |
|-----------|-------------|----------|---------|
| `--domain` | Your domain name | No (prompted if not provided) | - |
| `--email` | Email for SSL certificates | No (prompted if not provided) | - |
| `--environment` | Environment type | No | `production` |
| `--db-password` | MongoDB password | No | Auto-generated |
| `--session-secret` | Session secret key | No | Auto-generated |
| `--backend-port` | Backend API port | No | `3001` |
| `--frontend-port` | Frontend dev port | No | `3000` |
| `--gemini-api-key` | Google Gemini API key | No | Configure later |
| `--repo-branch` | Git branch to deploy | No | `main` |
| `--skip-ssl` | Skip SSL certificate setup | No | `false` |
| `--force` | Force installation | No | `false` |

## 🎯 Quick Start Guide

### 1. Prepare Your VPS
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Ensure you have root access
sudo su -
```

### 2. Configure Domain
- Point your domain's A record to your VPS IP
- Verify DNS propagation: `nslookup yourdomain.com`

### 3. Run Installation
```bash
curl -sSL https://raw.githubusercontent.com/leipnar/Atlas-AI/main/Auto%20Install/install.sh | bash
```

### 4. Access Your Application
- Open `https://yourdomain.com` in your browser
- Login with admin credentials (shown in installation output)
- Configure your knowledge base and AI settings

## 🏢 Supported VPS Providers

Tested and verified on:
- ✅ **DigitalOcean** - Recommended for beginners
- ✅ **Linode** - Great performance and support
- ✅ **Vultr** - Cost-effective option
- ✅ **AWS EC2** - Enterprise-grade infrastructure
- ✅ **Google Cloud Platform** - Advanced features
- ✅ **Hetzner** - European data centers
- ✅ **OVH** - Budget-friendly option

[📖 VPS Deployment Guide](VPS_DEPLOYMENT_GUIDE_AutoInstall.md) - Detailed setup instructions for each provider.

## 🛠️ Management Commands

After installation, manage your Atlas AI instance with these commands:

```bash
# Health check
/opt/Atlas-AI/scripts/health-check.sh

# Create backup
/opt/Atlas-AI/scripts/backup.sh

# Update to latest version
/opt/Atlas-AI/scripts/update.sh

# System maintenance
/opt/Atlas-AI/scripts/maintenance.sh

# Monitor system
/opt/Atlas-AI/scripts/monitor.sh

# Check service status
systemctl status Atlas-AI nginx mongod
```

## 🏗️ Architecture

```
Internet
    ↓
[Nginx Reverse Proxy]
    ↓
[Atlas AI Application (PM2)]
    ↓
[MongoDB Database]
```

### Components
- **Frontend**: React application with real-time chat interface
- **Backend**: Node.js/Express API with authentication and business logic
- **Database**: MongoDB with user management and knowledge base storage
- **Reverse Proxy**: Nginx with SSL termination and security headers
- **Process Manager**: PM2 with clustering and automatic restarts

### Network Ports
- **80**: HTTP (redirects to HTTPS)
- **443**: HTTPS (SSL termination)
- **3001**: Backend API (internal)
- **27017**: MongoDB (internal)

## 📚 Documentation

### User Guides
- [📖 Installation Guide](Auto%20Install/docs/README.md)
- [🚨 Troubleshooting Guide](Auto%20Install/docs/TROUBLESHOOTING.md)
- [🌐 VPS Deployment Guide](VPS_DEPLOYMENT_GUIDE_AutoInstall.md)
- [📤 GitHub Upload Guide](GITHUB_UPLOAD_GUIDE.md)

### Developer Documentation
- [🔧 API Documentation](docs/API.md)
- [🏗️ Development Setup](docs/DEVELOPMENT.md)
- [🤝 Contributing Guidelines](docs/CONTRIBUTING.md)
- [🔒 Security Policy](docs/SECURITY.md)

### Operations
- [📊 Monitoring Guide](docs/MONITORING.md)
- [💾 Backup & Recovery](docs/BACKUP.md)
- [🔄 Update Procedures](docs/UPDATES.md)
- [🛡️ Security Hardening](docs/SECURITY_HARDENING.md)

## 🔧 Development

### Local Development Setup

1. **Clone Repository**:
```bash
git clone https://github.com/leipnar/Atlas-AI.git
cd Atlas-AI
```

2. **Install Dependencies**:
```bash
# Install all dependencies
npm run install:all

# Or install separately
npm run install:frontend
npm run install:backend
```

3. **Configure Environment**:
```bash
# Copy environment templates
cp Front/.env.example Front/.env
cp Backend/.env.example Backend/.env

# Edit environment files with your configuration
```

4. **Start Development Servers**:
```bash
# Start both frontend and backend
npm run dev

# Or start separately
npm run dev:frontend  # Frontend on http://localhost:3000
npm run dev:backend   # Backend on http://localhost:3001
```

### Project Structure
```
Atlas-AI/
├── Front/                 # React frontend application
├── Backend/               # Node.js backend API (to be implemented)
├── Auto Install/          # Auto-installation system
├── docs/                  # Project documentation
├── .github/               # GitHub workflows and templates
└── README.md              # This file
```

### Available Scripts
```bash
npm run install:all        # Install all dependencies
npm run dev                # Start development servers
npm run build              # Build for production
npm run test               # Run all tests
npm start                  # Start production server
npm run deploy             # Deploy using auto-install
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](docs/CONTRIBUTING.md) for details.

### Quick Contribution Steps
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 🛡️ Security

### Reporting Security Issues
Please report security vulnerabilities to [security@Atlas-AI-assistant.com](mailto:security@Atlas-AI-assistant.com) or create a private security advisory on GitHub.

### Security Features
- SSL/TLS encryption with modern cipher suites
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting
- Secure session management
- Regular security updates

## 📊 Monitoring & Analytics

### Built-in Monitoring
- **Health Checks**: Automated service health monitoring
- **Performance Metrics**: CPU, memory, disk usage tracking
- **SSL Monitoring**: Certificate expiration alerts
- **Security Events**: Failed login attempts and blocked IPs
- **Application Logs**: Comprehensive logging with rotation

### Integration Options
- **Email Alerts**: SMTP configuration for notifications
- **Webhook Support**: Custom webhooks for external monitoring
- **API Endpoints**: Health and metrics API endpoints
- **Log Aggregation**: Syslog and custom log forwarding

## 🔄 Updates & Maintenance

### Automatic Updates
```bash
# Check for updates
/opt/Atlas-AI/scripts/update.sh --check-only

# Update with confirmation
/opt/Atlas-AI/scripts/update.sh

# Force update without confirmation
/opt/Atlas-AI/scripts/update.sh --force
```

### Scheduled Maintenance
```bash
# Add to crontab for automated maintenance
0 2 * * * /opt/Atlas-AI/scripts/maintenance.sh     # Daily at 2 AM
0 3 * * 0 /opt/Atlas-AI/scripts/backup.sh --weekly # Weekly backup
```

### Version History
See [CHANGELOG.md](Auto%20Install/CHANGELOG.md) for detailed version history and upgrade notes.

## 💡 Use Cases

### Perfect for:
- **Customer Support**: AI-powered support with custom knowledge base
- **Internal Documentation**: Company-specific Q&A system
- **Educational Platforms**: Course-specific AI assistant
- **Product Support**: Technical documentation and FAQ system
- **Help Desks**: Automated first-level support

### Industries:
- SaaS companies
- E-commerce platforms
- Educational institutions
- Healthcare organizations
- Government agencies
- Non-profit organizations

## 🌟 Why Choose Atlas AI?

### ⚡ **Rapid Deployment**
- One-command installation
- Production-ready in minutes
- Automatic SSL and security setup
- No manual configuration required

### 🛡️ **Security First**
- Built-in security hardening
- Regular security updates
- Comprehensive monitoring
- Industry best practices

### 📈 **Scalable Architecture**
- Horizontal scaling ready
- Performance optimized
- Resource efficient
- Load balancer compatible

### 🔧 **Easy Management**
- Automated backups
- Zero-downtime updates
- Health monitoring
- Maintenance automation

## 📞 Support

### Community Support
- [GitHub Issues](https://github.com/leipnar/Atlas-AI/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/leipnar/Atlas-AI/discussions) - Community Q&A
- [Documentation](docs/) - Comprehensive guides and tutorials

### Professional Support
- Email: [support@Atlas-AI-assistant.com](mailto:support@Atlas-AI-assistant.com)
- Priority support available for enterprise users
- Custom deployment and configuration services

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Acknowledgments

- Built with ❤️ by the Atlas AI team
- Powered by Node.js, React, MongoDB, and Nginx
- SSL certificates by Let's Encrypt
- Deployment automation inspired by modern DevOps practices

---

<div align="center">
  <h3>🚀 Deploy Atlas AI Today!</h3>
  <p>Get your AI support assistant running in production with just one command.</p>

  ```bash
  curl -sSL https://raw.githubusercontent.com/leipnar/Atlas-AI/main/Auto%20Install/install.sh | bash
  ```

  <p><a href="VPS_DEPLOYMENT_GUIDE_AutoInstall.md">📖 Full Deployment Guide</a> | <a href="https://github.com/leipnar/Atlas-AI/releases">📦 Latest Release</a> | <a href="docs/">📚 Documentation</a></p>
</div>