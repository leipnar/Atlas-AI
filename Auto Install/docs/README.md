# Atlas AI Auto-Installation System

A comprehensive auto-installation system for the Atlas AI Support Assistant that enables single-command deployment with full production configuration.

## 🚀 Quick Start

Deploy Atlas AI with a single command:

```bash
curl -sSL https://raw.githubusercontent.com/leipnar/Atlas-AI/main/Auto%20Install/install.sh | bash -s -- --domain=yourdomain.com --email=your@email.com
```

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Management Scripts](#management-scripts)
- [Monitoring](#monitoring)
- [Backup & Recovery](#backup--recovery)
- [Updates](#updates)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Architecture](#architecture)

## ✨ Features

### 🔧 Complete Deployment
- **Node.js Backend**: Automatic setup with TypeScript support
- **Frontend**: React-based web interface with build optimization
- **Database**: MongoDB with authentication and security hardening
- **Reverse Proxy**: Nginx with SSL termination and security headers
- **Process Management**: PM2 with clustering and auto-restart
- **SSL Certificates**: Automatic Let's Encrypt setup and renewal

### 🛡️ Security
- UFW firewall configuration with minimal attack surface
- Fail2ban protection against brute force attacks
- SSL/TLS encryption with modern cipher suites
- Database authentication and access controls
- Security headers and rate limiting
- Regular security updates

### 📊 Monitoring & Maintenance
- Health checks for all services
- Performance monitoring and alerting
- Automated backups with retention policies
- Log rotation and cleanup
- Update mechanism with rollback capability
- Comprehensive maintenance scripts

### 🔄 Operations
- Zero-downtime deployments
- Automatic service recovery
- Database migrations
- Environment-specific configurations
- Comprehensive logging
- Email notifications

## 📋 Prerequisites

### System Requirements
- **Operating System**: Ubuntu 18.04+, Debian 9+, CentOS 7+, RHEL 7+, Fedora 35+, Rocky Linux 8+, or AlmaLinux 8+
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 10GB free space
- **Network**: Internet connection for package downloads

### Domain & DNS
- Domain name pointing to your server
- DNS A record configured for your domain
- Port 80 and 443 accessible from the internet

### Email (Optional)
- SMTP server credentials for notifications
- Email address for SSL certificate registration

## 🚀 Installation

### Basic Installation

```bash
curl -sSL https://raw.githubusercontent.com/leipnar/Atlas-AI/main/Auto%20Install/install.sh | bash
```

### Advanced Installation

```bash
curl -sSL https://raw.githubusercontent.com/leipnar/Atlas-AI/main/Auto%20Install/install.sh | bash -s -- \
  --domain=yourdomain.com \
  --email=your@email.com \
  --db-name=my_atlas \
  --db-user=atlas_admin \
  --db-password=secure_password \
  --backend-port=3001 \
  --frontend-port=3000 \
  --environment=production \
  --git-branch=main \
  --node-version=18 \
  --no-ssl \
  --skip-firewall
```

### Installation Options

| Option | Description | Default |
|--------|-------------|---------|
| `--domain` | Domain name for the application | Required |
| `--email` | Email for SSL certificate | Required |
| `--db-name` | MongoDB database name | `atlas_ai` |
| `--db-user` | MongoDB username | `atlas_user` |
| `--db-password` | MongoDB password | Auto-generated |
| `--backend-port` | Backend server port | `3001` |
| `--frontend-port` | Frontend development port | `3000` |
| `--environment` | Environment type | `production` |
| `--git-branch` | Git branch to deploy | `main` |
| `--node-version` | Node.js version | `18` |
| `--no-ssl` | Skip SSL certificate setup | - |
| `--skip-firewall` | Skip firewall configuration | - |
| `--help` | Show help message | - |

## ⚙️ Configuration

### Environment Configuration

The installation creates an environment file at `/opt/atlas-ai/.env`:

```bash
# Server Configuration
NODE_ENV=production
PORT=3001
FRONTEND_PORT=3000

# Database Configuration
DATABASE_URL=mongodb://atlas_user:password@localhost:27017/atlas_ai
DB_NAME=atlas_ai
DB_USER=atlas_user
DB_PASSWORD=your_secure_password

# Authentication
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret

# SSL Configuration
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@email.com
SMTP_PASSWORD=your_app_password

# API Configuration
GEMINI_API_KEY=your_gemini_api_key
```

### Nginx Configuration

Located at `/etc/nginx/sites-available/yourdomain.com`:

- SSL termination with Let's Encrypt certificates
- Security headers and rate limiting
- Gzip compression and caching
- Reverse proxy to backend API
- Static file serving for frontend

### PM2 Configuration

Located at `/opt/atlas-ai/ecosystem.config.js`:

- Cluster mode for optimal performance
- Automatic restart on failures
- Memory and CPU monitoring
- Log rotation and management
- Environment-specific settings

## 🛠️ Management Scripts

### Health Check
```bash
/opt/atlas-ai/scripts/health-check.sh
```
Checks the health of all services and components.

### Monitoring
```bash
/opt/atlas-ai/scripts/monitor.sh [--daemon]
```
Continuous monitoring with metrics collection and alerting.

### Backup
```bash
/opt/atlas-ai/scripts/backup.sh [--type daily|weekly|monthly]
```
Creates comprehensive backups of application and database.

### Update
```bash
/opt/atlas-ai/scripts/update.sh [--force] [--check-only] [--rollback]
```
Updates the application to the latest version with rollback capability.

### Maintenance
```bash
/opt/atlas-ai/scripts/maintenance.sh [task]
```
Performs various maintenance tasks including cleanup and optimization.

## 📊 Monitoring

### Service Monitoring
- **Health Checks**: Automated health checks every 5 minutes
- **Performance Metrics**: CPU, memory, disk usage monitoring
- **SSL Certificate**: Automatic expiration monitoring
- **Database**: Connection and performance monitoring
- **Application**: Response time and error rate tracking

### Alerting
- Email notifications for critical issues
- System resource alerts (disk space, memory)
- Service failure notifications
- SSL certificate expiration warnings

### Log Management
- Centralized logging in `/var/log/atlas-ai/`
- Automatic log rotation and compression
- Error log monitoring and alerting
- Application performance logs

## 💾 Backup & Recovery

### Automatic Backups
- **Daily**: Application files and database
- **Weekly**: Full system backup
- **Monthly**: Archive backups
- **Pre-update**: Automatic backup before updates

### Backup Contents
- MongoDB database dump
- Application files and configuration
- SSL certificates and keys
- Nginx configuration
- Environment files

### Backup Locations
- Local: `/var/backups/atlas-ai/`
- Remote: Configurable S3, FTP, or SCP upload

### Recovery
```bash
# List available backups
ls -la /var/backups/atlas-ai/

# Restore from backup
/opt/atlas-ai/scripts/restore.sh /var/backups/atlas-ai/backup_20231201_120000
```

## 🔄 Updates

### Automatic Updates
The system can be configured for automatic updates:

```bash
# Add to crontab for weekly updates
0 2 * * 0 /opt/atlas-ai/scripts/update.sh --force
```

### Manual Updates
```bash
# Check for updates
/opt/atlas-ai/scripts/update.sh --check-only

# Update with confirmation
/opt/atlas-ai/scripts/update.sh

# Force update without confirmation
/opt/atlas-ai/scripts/update.sh --force

# Rollback to previous version
/opt/atlas-ai/scripts/update.sh --rollback
```

### Update Process
1. Pre-update backup creation
2. Service health verification
3. Code and dependency updates
4. Database migrations
5. Service restart and verification
6. Rollback on failure

## 🔧 Maintenance

### Regular Maintenance Tasks
```bash
# Run all maintenance tasks
/opt/atlas-ai/scripts/maintenance.sh

# Specific maintenance tasks
/opt/atlas-ai/scripts/maintenance.sh logs      # Clean old logs
/opt/atlas-ai/scripts/maintenance.sh backups  # Clean old backups
/opt/atlas-ai/scripts/maintenance.sh database # Optimize database
/opt/atlas-ai/scripts/maintenance.sh ssl      # Update SSL certificates
/opt/atlas-ai/scripts/maintenance.sh system   # Update system packages
```

### Scheduled Maintenance
Add to crontab for automated maintenance:

```bash
# Daily maintenance at 2 AM
0 2 * * * /opt/atlas-ai/scripts/maintenance.sh logs,backups

# Weekly full maintenance on Sunday at 3 AM
0 3 * * 0 /opt/atlas-ai/scripts/maintenance.sh
```

## 🐛 Troubleshooting

### Common Issues

#### Installation Fails
```bash
# Check installation logs
tail -f /var/log/atlas-ai/install.log

# Verify system requirements
curl -sSL https://raw.githubusercontent.com/leipnar/Atlas-AI/main/Auto%20Install/scripts/check-requirements.sh | bash
```

#### MongoDB SSL Library Issues (Ubuntu 24.04+)
The installer automatically handles libssl1.1 compatibility for newer Ubuntu versions:
```bash
# If MongoDB fails to install due to libssl1.1 dependency:
# 1. The installer automatically downloads and installs libssl1.1 compatibility package
# 2. Uses appropriate Ubuntu codename for MongoDB repository (jammy for 22.04+)
# 3. Fallback installation with dependency resolution

# Manual fix if needed:
wget http://archive.ubuntu.com/ubuntu/pool/main/o/openssl/libssl1.1_1.1.1f-1ubuntu2.23_amd64.deb
sudo dpkg -i libssl1.1_1.1.1f-1ubuntu2.23_amd64.deb
```

#### Service Not Starting
```bash
# Check service status
systemctl status atlas-ai nginx mongod

# Check application logs
tail -f /var/log/atlas-ai/application.log

# Check PM2 processes
sudo -u atlas-ai pm2 status
sudo -u atlas-ai pm2 logs
```

#### SSL Certificate Issues
```bash
# Check certificate status
/opt/atlas-ai/scripts/health-check.sh ssl

# Manually renew certificate
certbot renew --nginx --dry-run
certbot renew --nginx
```

#### Database Connection Issues
```bash
# Check MongoDB status
systemctl status mongod

# Test database connection
mongo atlas_ai --eval "db.stats()"

# Check authentication
mongo -u atlas_user -p --authenticationDatabase atlas_ai
```

#### High Resource Usage
```bash
# Check system resources
/opt/atlas-ai/scripts/monitor.sh --report

# Optimize PM2 processes
/opt/atlas-ai/scripts/maintenance.sh pm2

# Clean up disk space
/opt/atlas-ai/scripts/maintenance.sh disk
```

### Log Locations
- **Installation**: `/var/log/atlas-ai/install.log`
- **Application**: `/var/log/atlas-ai/application.log`
- **Health Checks**: `/var/log/atlas-ai/health-check.log`
- **Backups**: `/var/log/atlas-ai/backup.log`
- **Updates**: `/var/log/atlas-ai/update.log`
- **Maintenance**: `/var/log/atlas-ai/maintenance.log`
- **Nginx**: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
- **MongoDB**: `/var/log/mongodb/mongod.log`

### Recovery Procedures

#### Complete System Recovery
1. Stop all services
2. Restore from latest backup
3. Verify database integrity
4. Start services and verify functionality

#### Application-Only Recovery
1. Stop Atlas AI service
2. Restore application files
3. Restart service
4. Verify functionality

#### Database Recovery
1. Stop MongoDB service
2. Restore database from backup
3. Start MongoDB service
4. Verify data integrity

## 🛡️ Security

### Security Features
- **Firewall**: UFW with minimal port exposure
- **Intrusion Detection**: Fail2ban for brute force protection
- **SSL/TLS**: Strong encryption with modern cipher suites
- **Database Security**: Authentication and access controls
- **Application Security**: Security headers and input validation
- **Regular Updates**: Automated security patch installation

### Security Best Practices
1. **Keep System Updated**: Enable automatic security updates
2. **Strong Passwords**: Use complex passwords for all accounts
3. **Limited Access**: Restrict SSH access and use key-based authentication
4. **Monitor Logs**: Regularly review security logs
5. **Backup Encryption**: Encrypt sensitive backup data
6. **Network Security**: Use VPN for administrative access

### Security Monitoring
```bash
# Check security status
/opt/atlas-ai/scripts/health-check.sh security

# Review security logs
tail -f /var/log/auth.log
tail -f /var/log/fail2ban.log

# Check firewall status
ufw status verbose

# Monitor failed login attempts
journalctl -u ssh --since "1 hour ago" | grep Failed
```

## 🏗️ Architecture

### System Architecture
```
Internet
    ↓
[Load Balancer/CDN] (Optional)
    ↓
[Nginx Reverse Proxy]
    ↓
[Atlas AI Application (PM2)]
    ↓
[MongoDB Database]
```

### Component Overview

#### Frontend (React)
- Static files served by Nginx
- Responsive web interface
- Real-time chat functionality
- Admin dashboard

#### Backend (Node.js/Express)
- RESTful API endpoints
- Authentication and authorization
- Business logic processing
- Database operations

#### Database (MongoDB)
- User management
- Knowledge base storage
- Conversation logs
- Application configuration

#### Reverse Proxy (Nginx)
- SSL termination
- Load balancing
- Static file serving
- Security headers

#### Process Manager (PM2)
- Application clustering
- Automatic restarts
- Performance monitoring
- Log management

### Network Architecture
- **Port 80**: HTTP (redirects to HTTPS)
- **Port 443**: HTTPS (SSL termination)
- **Port 3001**: Backend API (internal)
- **Port 27017**: MongoDB (internal)

### File Structure
```
/opt/atlas-ai/
├── src/                    # Application source code
├── Front/                  # Frontend build files
├── node_modules/           # Node.js dependencies
├── scripts/                # Management scripts
├── .env                    # Environment configuration
├── ecosystem.config.js     # PM2 configuration
├── package.json            # Node.js package file
└── .install_info           # Installation metadata

/etc/nginx/sites-available/
└── yourdomain.com          # Nginx configuration

/var/log/atlas-ai/          # Application logs
/var/backups/atlas-ai/      # Backup storage
```

## 📞 Support

For support, issues, or feature requests:

1. **Documentation**: Check this documentation first
2. **Logs**: Review relevant log files for error details
3. **Health Check**: Run health check script for diagnostics
4. **GitHub Issues**: Create an issue in the project repository
5. **Community**: Check community forums and discussions

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

---

*Atlas AI Auto-Installation System - Making deployment simple and secure.*