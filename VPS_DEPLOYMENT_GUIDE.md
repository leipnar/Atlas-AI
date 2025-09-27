# Atlas AI Support Assistant - VPS Deployment Guide

This comprehensive guide will walk you through deploying the Atlas AI Support Assistant (frontend + backend) on a Virtual Private Server (VPS) for development and testing purposes.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [VPS Setup](#vps-setup)
3. [Environment Preparation](#environment-preparation)
4. [MongoDB Setup](#mongodb-setup)
5. [Backend Deployment](#backend-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [Nginx Configuration](#nginx-configuration)
8. [SSL/TLS Setup](#ssltls-setup)
9. [Process Management](#process-management)
10. [Monitoring and Logging](#monitoring-and-logging)
11. [Security Hardening](#security-hardening)
12. [Backup and Maintenance](#backup-and-maintenance)
13. [Troubleshooting](#troubleshooting)

## Prerequisites

### VPS Requirements

- **Operating System**: Ubuntu 20.04 LTS or Ubuntu 22.04 LTS
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB SSD
- **CPU**: 1 vCPU (2 vCPUs recommended)
- **Network**: Public IP address and domain name (optional but recommended)

### Local Requirements

- SSH client
- Git
- Basic knowledge of Linux command line

## VPS Setup

### 1. Initial Server Access

Connect to your VPS via SSH:

```bash
ssh root@your-server-ip
# or if you have a non-root user:
ssh username@your-server-ip
```

### 2. Update System Packages

```bash
# Update package list and upgrade system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git htop unzip software-properties-common
```

### 3. Create Non-Root User (if not exists)

```bash
# Create new user
sudo adduser atlas

# Add user to sudo group
sudo usermod -aG sudo atlas

# Switch to new user
su - atlas
```

### 4. Configure SSH Key Authentication (Recommended)

On your local machine:
```bash
# Generate SSH key if you don't have one
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Copy public key to server
ssh-copy-id atlas@your-server-ip
```

### 5. Secure SSH Configuration

```bash
sudo nano /etc/ssh/sshd_config
```

Update these settings:
```
Port 2222                    # Change default port
PermitRootLogin no          # Disable root login
PasswordAuthentication no   # Use only key-based auth
PubkeyAuthentication yes    # Enable public key auth
```

Restart SSH service:
```bash
sudo systemctl restart ssh
```

## Environment Preparation

### 1. Install Node.js

```bash
# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u atlas --hp /home/atlas
```

### 3. Install Nginx

```bash
sudo apt install -y nginx

# Enable and start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 4. Configure Firewall

```bash
# Install and configure UFW
sudo apt install -y ufw

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (adjust port if you changed it)
sudo ufw allow 2222/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow MongoDB (only from localhost)
sudo ufw allow from 127.0.0.1 to any port 27017

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status
```

## MongoDB Setup

### 1. Install MongoDB

```bash
# Import the MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package list
sudo apt update

# Install MongoDB
sudo apt install -y mongodb-org

# Enable and start MongoDB
sudo systemctl enable mongod
sudo systemctl start mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

### 2. Secure MongoDB

```bash
# Connect to MongoDB shell
mongosh

# Switch to admin database
use admin

# Create admin user
db.createUser({
  user: "admin",
  pwd: "strong_admin_password_here",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
})

# Create application database and user
use atlas_ai
db.createUser({
  user: "atlas_user",
  pwd: "strong_app_password_here",
  roles: ["readWrite"]
})

# Exit MongoDB shell
exit
```

### 3. Enable MongoDB Authentication

```bash
# Edit MongoDB configuration
sudo nano /etc/mongod.conf
```

Add these lines:
```yaml
security:
  authorization: enabled
```

Restart MongoDB:
```bash
sudo systemctl restart mongod
```

## Backend Deployment

### 1. Clone Repository and Setup

```bash
# Navigate to home directory
cd ~

# Clone the repository (replace with your actual repository URL)
git clone https://github.com/your-username/atlas-ai.git
cd atlas-ai

# Navigate to backend directory
cd Back

# Install dependencies
npm install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit environment file
nano .env
```

Configure the environment variables:
```env
# Server Configuration
PORT=3001
FRONTEND_URL=https://your-domain.com

# Database Connection
DATABASE_URL=mongodb://atlas_user:strong_app_password_here@localhost:27017/atlas_ai

# Authentication
SESSION_SECRET=generate_a_very_strong_random_string_here

# Google Gemini API Key
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Environment
NODE_ENV=production

# Logging
LOG_LEVEL=warn

# Security
TRUST_PROXY=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5
```

### 3. Build and Test Backend

```bash
# Build the TypeScript code
npm run build

# Test the application
npm run type-check
npm start
```

Press `Ctrl+C` to stop the test run.

### 4. Setup PM2 for Backend

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

Add this configuration:
```javascript
module.exports = {
  apps: [{
    name: 'atlas-backend',
    script: './dist/server.js',
    cwd: '/home/atlas/atlas-ai/Back',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/home/atlas/logs/backend-error.log',
    out_file: '/home/atlas/logs/backend-out.log',
    log_file: '/home/atlas/logs/backend-combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

Create log directory and start the application:
```bash
# Create logs directory
mkdir -p ~/logs

# Start backend with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check status
pm2 status
pm2 logs atlas-backend
```

## Frontend Deployment

### 1. Install Frontend Dependencies

```bash
# Navigate to frontend directory
cd ~/atlas-ai/Front

# Install dependencies (assuming it's a React/Vue/etc. project)
npm install
```

### 2. Build Frontend

```bash
# Build for production
npm run build

# The build files should be in 'dist' or 'build' directory
ls -la dist/  # or ls -la build/
```

### 3. Setup Frontend Serving

```bash
# Create web directory
sudo mkdir -p /var/www/atlas-ai

# Copy build files
sudo cp -r dist/* /var/www/atlas-ai/  # or build/* if using build directory

# Set proper permissions
sudo chown -R www-data:www-data /var/www/atlas-ai
sudo chmod -R 755 /var/www/atlas-ai
```

## Nginx Configuration

### 1. Create Nginx Configuration

```bash
# Create new site configuration
sudo nano /etc/nginx/sites-available/atlas-ai
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Root directory for frontend
    root /var/www/atlas-ai;
    index index.html index.htm;

    # Handle frontend routes (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
```

### 2. Enable Site and Test Configuration

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/atlas-ai /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## SSL/TLS Setup

### 1. Install Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate

```bash
# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### 3. Update Nginx Configuration for HTTPS

The certbot should automatically update your Nginx configuration, but verify it includes:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Rest of your configuration...
}
```

## Process Management

### 1. PM2 Management Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs atlas-backend

# Restart application
pm2 restart atlas-backend

# Stop application
pm2 stop atlas-backend

# Delete application from PM2
pm2 delete atlas-backend

# Monitor in real-time
pm2 monit

# Save current configuration
pm2 save

# Resurrect saved configuration
pm2 resurrect
```

### 2. System Service Management

```bash
# Check backend status via PM2
sudo systemctl status pm2-atlas

# Restart MongoDB
sudo systemctl restart mongod

# Restart Nginx
sudo systemctl restart nginx

# Check all services
sudo systemctl status mongod nginx pm2-atlas
```

## Monitoring and Logging

### 1. Setup Log Rotation

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/atlas-ai
```

Add this configuration:
```
/home/atlas/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 atlas atlas
    postrotate
        pm2 restart atlas-backend
    endscript
}
```

### 2. System Monitoring

```bash
# Install system monitoring tools
sudo apt install -y htop iotop nethogs

# Monitor system resources
htop

# Monitor network connections
sudo netstat -tulpn | grep LISTEN

# Monitor disk usage
df -h
du -sh /home/atlas/atlas-ai/
```

### 3. Application Monitoring

```bash
# Monitor PM2 processes
pm2 monit

# Check backend health
curl http://localhost:3001/health

# Check application logs
tail -f ~/logs/backend-combined.log

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

## Security Hardening

### 1. System Security

```bash
# Install and configure fail2ban
sudo apt install -y fail2ban

# Create jail configuration
sudo nano /etc/fail2ban/jail.local
```

Add this configuration:
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = 2222
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
```

Start fail2ban:
```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 2. MongoDB Security

```bash
# Ensure MongoDB only listens on localhost
sudo nano /etc/mongod.conf
```

Ensure this configuration:
```yaml
net:
  port: 27017
  bindIp: 127.0.0.1
```

### 3. Application Security

Update backend environment variables:
```bash
nano ~/atlas-ai/Back/.env
```

Ensure secure settings:
```env
NODE_ENV=production
SESSION_SECRET=very_long_random_string_here
TRUST_PROXY=true
```

## Backup and Maintenance

### 1. Database Backup

Create backup script:
```bash
nano ~/backup-mongodb.sh
```

Add this script:
```bash
#!/bin/bash

BACKUP_DIR="/home/atlas/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="atlas_ai"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create MongoDB dump
mongodump --host localhost:27017 --db $DB_NAME --username atlas_user --password strong_app_password_here --out $BACKUP_DIR/mongodb_$TIMESTAMP

# Compress backup
tar -czf $BACKUP_DIR/mongodb_backup_$TIMESTAMP.tar.gz -C $BACKUP_DIR mongodb_$TIMESTAMP

# Remove uncompressed dump
rm -rf $BACKUP_DIR/mongodb_$TIMESTAMP

# Keep only last 7 backups
cd $BACKUP_DIR
ls -t mongodb_backup_*.tar.gz | tail -n +8 | xargs -r rm

echo "Backup completed: mongodb_backup_$TIMESTAMP.tar.gz"
```

Make executable and setup cron:
```bash
chmod +x ~/backup-mongodb.sh

# Add to crontab (daily backup at 2 AM)
crontab -e
```

Add this line:
```
0 2 * * * /home/atlas/backup-mongodb.sh
```

### 2. Application Updates

Create update script:
```bash
nano ~/update-atlas.sh
```

Add this script:
```bash
#!/bin/bash

cd /home/atlas/atlas-ai

# Backup current version
cp -r Back Back_backup_$(date +%Y%m%d_%H%M%S)

# Pull latest changes
git pull origin main

# Update backend
cd Back
npm install
npm run build

# Restart application
pm2 restart atlas-backend

# Update frontend
cd ../Front
npm install
npm run build

# Update web files
sudo cp -r dist/* /var/www/atlas-ai/
sudo chown -R www-data:www-data /var/www/atlas-ai

echo "Update completed successfully"
```

Make executable:
```bash
chmod +x ~/update-atlas.sh
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Backend Not Starting

```bash
# Check PM2 logs
pm2 logs atlas-backend

# Check if port is in use
sudo netstat -tulpn | grep 3001

# Check environment variables
cat ~/atlas-ai/Back/.env

# Manually test backend
cd ~/atlas-ai/Back
npm start
```

#### 2. Database Connection Issues

```bash
# Check MongoDB status
sudo systemctl status mongod

# Test MongoDB connection
mongosh --host localhost:27017 --username atlas_user --password --authenticationDatabase atlas_ai

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

#### 3. Frontend Not Loading

```bash
# Check Nginx status
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Verify web files
ls -la /var/www/atlas-ai/
```

#### 4. SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Test SSL configuration
sudo nginx -t

# Renew certificate manually
sudo certbot renew --force-renewal
```

#### 5. Performance Issues

```bash
# Check system resources
htop
free -h
df -h

# Check application performance
pm2 monit

# Check database performance
mongosh --eval "db.serverStatus()"
```

### Log Locations

- **Backend Logs**: `~/logs/backend-*.log`
- **PM2 Logs**: `~/.pm2/logs/`
- **Nginx Logs**: `/var/log/nginx/`
- **MongoDB Logs**: `/var/log/mongodb/mongod.log`
- **System Logs**: `/var/log/syslog`

### Useful Commands

```bash
# Quick health check
curl -I http://localhost:3001/health
curl -I https://your-domain.com

# Check all running services
sudo systemctl status mongod nginx pm2-atlas

# Check network connections
sudo ss -tulpn

# Check disk space
df -h
du -sh /home/atlas/atlas-ai/

# Check memory usage
free -h
ps aux --sort=-%mem | head

# Check CPU usage
top
ps aux --sort=-%cpu | head
```

## Security Checklist

- [ ] SSH key-based authentication configured
- [ ] Default SSH port changed
- [ ] Firewall (UFW) enabled and configured
- [ ] MongoDB authentication enabled
- [ ] Strong passwords for all accounts
- [ ] SSL/TLS certificate installed
- [ ] Fail2ban installed and configured
- [ ] Regular security updates applied
- [ ] Log monitoring in place
- [ ] Backup strategy implemented

## Performance Optimization

1. **MongoDB Optimization**:
   - Create indexes for frequently queried fields
   - Monitor slow queries
   - Configure appropriate connection limits

2. **Nginx Optimization**:
   - Enable gzip compression
   - Configure proper caching headers
   - Use HTTP/2 if available

3. **Application Optimization**:
   - Monitor memory usage with PM2
   - Configure appropriate restart policies
   - Use clustering if needed (multiple PM2 instances)

4. **System Optimization**:
   - Configure swap if needed
   - Monitor and optimize disk I/O
   - Set up log rotation

This comprehensive guide should help you successfully deploy and maintain the Atlas AI Support Assistant on a VPS. Remember to customize the configuration according to your specific requirements and keep all components updated for security and performance.