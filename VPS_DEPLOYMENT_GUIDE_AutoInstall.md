# Atlas AI VPS Deployment Guide - Auto Installation

This comprehensive guide will walk you through deploying Atlas AI on a VPS using the automated installation system. From VPS setup to one-command deployment.

## 📋 Table of Contents

- [VPS Requirements](#vps-requirements)
- [VPS Setup](#vps-setup)
- [Domain Configuration](#domain-configuration)
- [Pre-Installation Checklist](#pre-installation-checklist)
- [One-Command Installation](#one-command-installation)
- [Post-Installation Verification](#post-installation-verification)
- [VPS Provider Specific Guides](#vps-provider-specific-guides)
- [Troubleshooting](#troubleshooting)
- [Security Hardening](#security-hardening)
- [Monitoring & Maintenance](#monitoring--maintenance)

## 🖥️ VPS Requirements

### Minimum Requirements
- **OS**: Ubuntu 18.04+, Debian 9+, CentOS 7+, RHEL 7+, Fedora 35+, Rocky Linux 8+, or AlmaLinux 8+
- **RAM**: 2GB (4GB recommended for production)
- **Storage**: 20GB SSD (50GB+ recommended)
- **CPU**: 1 vCPU (2+ vCPUs recommended)
- **Bandwidth**: 1TB/month
- **Network**: Public IPv4 address

### Recommended VPS Specifications
- **RAM**: 4GB or higher
- **Storage**: 50GB+ SSD
- **CPU**: 2+ vCPUs
- **Network**: High-speed connection (100+ Mbps)

### Supported VPS Providers
- ✅ **DigitalOcean** (Droplets)
- ✅ **Linode** (Linodes)
- ✅ **Vultr** (Cloud Compute)
- ✅ **AWS** (EC2 instances)
- ✅ **Google Cloud Platform** (Compute Engine)
- ✅ **Hetzner** (Cloud servers)
- ✅ **OVH** (VPS)
- ✅ **Contabo** (VPS)

## 🚀 VPS Setup

### Step 1: Create VPS Instance

#### DigitalOcean Example:
1. **Create Account**: Sign up at [DigitalOcean](https://digitalocean.com)
2. **Create Droplet**:
   - Choose Image: Ubuntu 22.04 LTS
   - Choose Plan: Basic ($12/month - 2GB RAM, 1 vCPU, 50GB SSD)
   - Choose Datacenter: Closest to your users
   - Authentication: SSH Key (recommended) or Password
   - Add Tags: `atlas-ai`, `production`

#### AWS EC2 Example:
1. **Launch Instance**:
   - AMI: Ubuntu Server 22.04 LTS
   - Instance Type: t3.small (2 vCPUs, 2GB RAM)
   - Storage: 20GB GP2 (increase as needed)
   - Security Group: SSH (22), HTTP (80), HTTPS (443)

#### Linode Example:
1. **Create Linode**:
   - Distribution: Ubuntu 22.04 LTS
   - Plan: Nanode 2GB ($12/month)
   - Region: Closest to your users
   - Root Password: Strong password

### Step 2: Initial Server Setup

#### Connect to Your VPS:
```bash
# Replace YOUR_SERVER_IP with your actual server IP
ssh root@YOUR_SERVER_IP

# Or if using a different user:
ssh username@YOUR_SERVER_IP
sudo su -
```

#### Update System:
```bash
# Ubuntu/Debian
apt update && apt upgrade -y

# CentOS/RHEL 7
yum update -y

# CentOS/RHEL 8+, Fedora, Rocky Linux, AlmaLinux
dnf update -y
```

#### Create Non-Root User (Optional but Recommended):
```bash
# Create user
adduser atlasadmin
usermod -aG sudo atlasadmin

# Set up SSH key for new user (if using keys)
mkdir -p /home/atlasadmin/.ssh
cp ~/.ssh/authorized_keys /home/atlasadmin/.ssh/
chown -R atlasadmin:atlasadmin /home/atlasadmin/.ssh
chmod 700 /home/atlasadmin/.ssh
chmod 600 /home/atlasadmin/.ssh/authorized_keys
```

### Step 3: Basic Security Setup

#### Configure SSH (Optional but Recommended):
```bash
# Edit SSH configuration
nano /etc/ssh/sshd_config

# Recommended changes:
# Port 2222  # Change from default 22
# PermitRootLogin no  # Disable root login
# PasswordAuthentication no  # Use keys only
# MaxAuthTries 3

# Restart SSH service
systemctl restart sshd
```

#### Basic Firewall Setup:
```bash
# Ubuntu/Debian
ufw allow ssh
ufw allow 80
ufw allow 443
ufw enable

# CentOS/RHEL/Fedora/Rocky Linux/AlmaLinux (using firewalld)
systemctl enable firewalld
systemctl start firewalld
firewall-cmd --permanent --add-service=ssh
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

## 🌐 Domain Configuration

### Step 1: Purchase Domain
Choose a domain registrar:
- **Namecheap** (recommended for beginners)
- **Cloudflare** (best performance)
- **Google Domains**
- **GoDaddy**

### Step 2: Configure DNS
Point your domain to your VPS IP address:

#### Method 1: Direct DNS Configuration
```
Type: A
Name: @
Value: YOUR_VPS_IP_ADDRESS
TTL: 300

Type: A
Name: www
Value: YOUR_VPS_IP_ADDRESS
TTL: 300
```

#### Method 2: Using Cloudflare (Recommended)
1. **Add Site to Cloudflare**:
   - Sign up at [Cloudflare](https://cloudflare.com)
   - Add your domain
   - Follow nameserver change instructions

2. **DNS Configuration**:
   ```
   Type: A
   Name: yourdomain.com
   IPv4: YOUR_VPS_IP_ADDRESS
   Proxy: ✅ Proxied (orange cloud)

   Type: A
   Name: www
   IPv4: YOUR_VPS_IP_ADDRESS
   Proxy: ✅ Proxied (orange cloud)
   ```

3. **SSL/TLS Settings**:
   - SSL/TLS mode: "Full (strict)"
   - Always Use HTTPS: ✅ On
   - Minimum TLS Version: 1.2

### Step 3: Verify DNS Propagation
```bash
# Check DNS resolution
nslookup yourdomain.com
dig yourdomain.com A

# Test from different locations
# Use online tools like: whatsmydns.net
```

⏰ **Note**: DNS propagation can take 4-48 hours. You can proceed with installation once basic resolution works.

## ✅ Pre-Installation Checklist

Before running the installation command, verify:

### 🔧 System Checklist
- [ ] VPS is running and accessible via SSH
- [ ] You have root access (or sudo privileges)
- [ ] System is updated (`apt update && apt upgrade -y`)
- [ ] At least 2GB RAM and 20GB storage available
- [ ] Internet connectivity works (`ping google.com`)

### 🌐 Domain Checklist
- [ ] Domain is purchased and under your control
- [ ] DNS A record points to your VPS IP address
- [ ] Domain resolves correctly (`nslookup yourdomain.com`)
- [ ] Both `yourdomain.com` and `www.yourdomain.com` resolve

### 📧 Email Checklist
- [ ] Valid email address for SSL certificate registration
- [ ] Email address is accessible (you'll receive Let's Encrypt notifications)

### 🔐 Security Checklist
- [ ] SSH access is secure (key-based authentication recommended)
- [ ] Strong passwords are set
- [ ] Basic firewall is configured
- [ ] Only necessary ports are open (22/2222, 80, 443)

## 🚀 One-Command Installation

### Basic Installation
Once all prerequisites are met, run the installation command:

```bash
curl -sSL https://raw.githubusercontent.com/leipnar/Atlas-AI/main/Auto%20Install/install.sh | bash -s -- --domain=yourdomain.com --email=your@email.com
```

### Advanced Installation with Options
```bash
curl -sSL https://raw.githubusercontent.com/leipnar/Atlas-AI/main/Auto%20Install/install.sh | bash -s -- \
  --domain=yourdomain.com \
  --email=your@email.com \
  --environment=production \
  --db-password=your_secure_db_password \
  --backend-port=3001 \
  --gemini-api-key=your_gemini_api_key
```

### Installation Options Explained

| Option | Description | Example | Required |
|--------|-------------|---------|----------|
| `--domain` | Your domain name | `--domain=atlas.example.com` | ✅ Yes |
| `--email` | Email for SSL certificates | `--email=admin@example.com` | ✅ Yes |
| `--environment` | Environment type | `--environment=production` | No (default: production) |
| `--db-password` | MongoDB password | `--db-password=SecurePass123` | No (auto-generated) |
| `--session-secret` | Session secret key | `--session-secret=MySecret123` | No (auto-generated) |
| `--backend-port` | Backend API port | `--backend-port=3001` | No (default: 3001) |
| `--frontend-port` | Frontend dev port | `--frontend-port=3000` | No (default: 3000) |
| `--gemini-api-key` | Google Gemini API key | `--gemini-api-key=AIza...` | No (can set later) |
| `--repo-branch` | Git branch to deploy | `--repo-branch=main` | No (default: main) |
| `--skip-ssl` | Skip SSL setup | `--skip-ssl` | No |
| `--force` | Force installation | `--force` | No |

### What Happens During Installation

1. **🔍 System Checks** (2-3 minutes)
   - Validates OS compatibility
   - Checks system requirements
   - Verifies internet connectivity
   - Validates input parameters

2. **📦 Package Installation** (5-10 minutes)
   - Updates system packages
   - Installs Node.js, MongoDB, Nginx
   - Installs PM2 process manager
   - Installs security tools (UFW, Fail2ban)

3. **⚙️ Configuration** (3-5 minutes)
   - Downloads application code
   - Configures environment variables
   - Sets up database with authentication
   - Configures Nginx reverse proxy

4. **🔐 SSL Setup** (2-5 minutes)
   - Installs Certbot
   - Obtains Let's Encrypt certificates
   - Configures HTTPS redirects

5. **🛡️ Security Hardening** (2-3 minutes)
   - Configures firewall rules
   - Sets up intrusion prevention
   - Applies security headers

6. **🚀 Service Startup** (1-2 minutes)
   - Starts all services
   - Enables auto-startup
   - Performs health checks

**Total Installation Time**: 15-30 minutes

## ✅ Post-Installation Verification

### 1. Check Service Status
```bash
# Check all services
systemctl status atlas-ai nginx mongod

# Check PM2 processes
sudo -u atlas-ai pm2 status

# Check application health
/opt/atlas-ai/scripts/health-check.sh
```

### 2. Test Web Access
```bash
# Test HTTP (should redirect to HTTPS)
curl -I http://yourdomain.com

# Test HTTPS
curl -I https://yourdomain.com

# Test backend API
curl https://yourdomain.com/api/health
```

### 3. Verify SSL Certificate
```bash
# Check certificate details
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Check certificate expiration
echo | openssl s_client -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

### 4. Check Logs
```bash
# Installation logs
tail -f /var/log/atlas-ai/install.log

# Application logs
tail -f /var/log/atlas-ai/application.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 5. Access Admin Panel
1. Open browser to `https://yourdomain.com`
2. Click "Login" or navigate to admin panel
3. Use default credentials (check installation output or logs)
4. **Important**: Change default passwords immediately!

## 🏢 VPS Provider Specific Guides

### DigitalOcean Deployment

#### Quick Setup:
```bash
# 1. Create Droplet
doctl compute droplet create atlas-ai \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-2gb \
  --region nyc1 \
  --ssh-keys YOUR_SSH_KEY_ID

# 2. Get IP address
doctl compute droplet list

# 3. Connect and install
ssh root@DROPLET_IP
curl -sSL https://raw.githubusercontent.com/leipnar/Atlas-AI/main/Auto%20Install/install.sh | bash -s -- --domain=yourdomain.com --email=your@email.com
```

#### DigitalOcean Specific Notes:
- **Monitoring**: Enable DigitalOcean monitoring in droplet settings
- **Backups**: Enable automated backups ($1.20/month for 2GB droplet)
- **Firewall**: Use DigitalOcean Cloud Firewall for additional security
- **Load Balancer**: Add DigitalOcean Load Balancer for high availability

### AWS EC2 Deployment

#### Quick Setup:
```bash
# 1. Launch instance (use AWS CLI or Console)
aws ec2 run-instances \
  --image-id ami-0557a15b87f6559cf \
  --count 1 \
  --instance-type t3.small \
  --key-name YOUR_KEY_PAIR \
  --security-group-ids sg-YOUR_SECURITY_GROUP

# 2. Connect
ssh -i YOUR_KEY.pem ubuntu@INSTANCE_IP
sudo su -

# 3. Install
curl -sSL https://raw.githubusercontent.com/leipnar/Atlas-AI/main/Auto%20Install/install.sh | bash -s -- --domain=yourdomain.com --email=your@email.com
```

#### AWS Specific Considerations:
- **Security Groups**: Configure inbound rules for ports 22, 80, 443
- **Elastic IP**: Assign static IP to prevent IP changes
- **EBS Volumes**: Use GP3 volumes for better performance
- **CloudWatch**: Enable detailed monitoring
- **Route 53**: Use for DNS management
- **Certificate Manager**: Alternative to Let's Encrypt

### Linode Deployment

#### Quick Setup:
```bash
# 1. Create Linode via CLI or web interface
linode-cli linodes create \
  --type g6-standard-2 \
  --region us-east \
  --image linode/ubuntu22.04 \
  --root_pass YOUR_ROOT_PASSWORD

# 2. Connect and install
ssh root@LINODE_IP
curl -sSL https://raw.githubusercontent.com/leipnar/Atlas-AI/main/Auto%20Install/install.sh | bash -s -- --domain=yourdomain.com --email=your@email.com
```

### Vultr Deployment

#### Quick Setup:
```bash
# Access via Vultr web interface or API
# Create Ubuntu 22.04 server with 2GB+ RAM

ssh root@VULTR_IP
curl -sSL https://raw.githubusercontent.com/leipnar/Atlas-AI/main/Auto%20Install/install.sh | bash -s -- --domain=yourdomain.com --email=your@email.com
```

## 🚨 Troubleshooting

### Common Installation Issues

#### 1. DNS Not Resolving
**Symptoms**: SSL certificate generation fails, domain not accessible
```bash
# Check DNS resolution
nslookup yourdomain.com
dig yourdomain.com A

# Solution: Wait for DNS propagation or check DNS configuration
```

#### 2. Port Already in Use
**Symptoms**: Installation fails with port binding errors
```bash
# Check what's using ports
netstat -tlnp | grep -E ":(80|443|3001)"

# Solution: Stop conflicting services or use --force flag
sudo systemctl stop apache2  # If Apache is installed
sudo systemctl stop nginx    # If Nginx is already installed
```

#### 3. Insufficient Memory
**Symptoms**: Installation fails during package installation or application startup
```bash
# Check memory usage
free -h

# Solution: Add swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### 4. SSL Certificate Issues
**Symptoms**: HTTPS not working, certificate errors
```bash
# Check Let's Encrypt logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# Manual certificate generation
sudo certbot --nginx -d yourdomain.com

# Check certificate status
sudo certbot certificates
```

#### 5. Application Not Starting
**Symptoms**: 502 Bad Gateway, service failures
```bash
# Check application logs
sudo tail -f /var/log/atlas-ai/application.log

# Check PM2 status
sudo -u atlas-ai pm2 status
sudo -u atlas-ai pm2 logs

# Restart services
sudo systemctl restart atlas-ai
sudo -u atlas-ai pm2 restart all
```

### Emergency Recovery

#### Complete System Reset:
```bash
# Stop all services
sudo systemctl stop atlas-ai nginx mongod

# Remove installation
sudo rm -rf /opt/atlas-ai
sudo rm -rf /var/log/atlas-ai
sudo rm -rf /var/backups/atlas-ai

# Remove users and databases
sudo deluser atlas-ai
sudo mongo admin --eval "db.dropDatabase()"

# Re-run installation
curl -sSL https://raw.githubusercontent.com/leipnar/Atlas-AI/main/Auto%20Install/install.sh | bash -s -- --domain=yourdomain.com --email=your@email.com --force
```

## 🔐 Security Hardening

### Immediate Post-Installation Security

#### 1. Change Default Passwords
```bash
# Change admin user password in Atlas AI interface
# Navigate to: https://yourdomain.com/admin/settings

# Change system passwords
sudo passwd atlas-ai
sudo passwd root  # If root login is enabled
```

#### 2. Configure SSH Keys
```bash
# Generate SSH key pair (on your local machine)
ssh-keygen -t rsa -b 4096 -C "your@email.com"

# Copy public key to server
ssh-copy-id root@yourdomain.com

# Disable password authentication
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd
```

#### 3. Enable Additional Security
```bash
# Install additional security tools
sudo apt install fail2ban rkhunter chkrootkit

# Configure fail2ban for additional services
sudo nano /etc/fail2ban/jail.local
# Add sections for nginx, ssh, etc.

# Run security scans
sudo rkhunter --check
sudo chkrootkit
```

#### 4. Set Up Monitoring
```bash
# Enable comprehensive monitoring
/opt/atlas-ai/scripts/monitor.sh --daemon

# Set up log monitoring
sudo tail -f /var/log/auth.log  # SSH attempts
sudo tail -f /var/log/fail2ban.log  # Blocked IPs
```

### Firewall Configuration

#### Advanced UFW Rules:
```bash
# Reset and configure UFW
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow necessary services
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Rate limiting for SSH
sudo ufw limit ssh

# Allow from specific IPs only (optional)
sudo ufw allow from YOUR_OFFICE_IP to any port 22

# Enable firewall
sudo ufw enable
```

## 📊 Monitoring & Maintenance

### Daily Monitoring Commands

```bash
# Quick system health check
/opt/atlas-ai/scripts/health-check.sh

# Check service status
sudo systemctl status atlas-ai nginx mongod

# Check resource usage
htop
df -h
free -h

# Check application logs for errors
sudo tail -50 /var/log/atlas-ai/application.log | grep -i error
```

### Weekly Maintenance

```bash
# Run full maintenance
sudo /opt/atlas-ai/scripts/maintenance.sh

# Update system packages
sudo apt update && sudo apt upgrade -y

# Check for Atlas AI updates
sudo /opt/atlas-ai/scripts/update.sh --check-only

# Review security logs
sudo grep "Failed password" /var/log/auth.log | tail -20
```

### Monthly Tasks

```bash
# Full system backup
sudo /opt/atlas-ai/scripts/backup.sh --type monthly

# Security audit
sudo rkhunter --check
sudo chkrootkit

# Performance review
sudo /opt/atlas-ai/scripts/monitor.sh --report

# SSL certificate check
sudo certbot certificates
```

### Automated Monitoring Setup

#### Set Up Cron Jobs:
```bash
# Edit crontab
sudo crontab -e

# Add monitoring jobs
# Health check every 5 minutes
*/5 * * * * /opt/atlas-ai/scripts/health-check.sh > /dev/null 2>&1

# Daily backup at 2 AM
0 2 * * * /opt/atlas-ai/scripts/backup.sh --type daily

# Weekly maintenance on Sunday at 3 AM
0 3 * * 0 /opt/atlas-ai/scripts/maintenance.sh

# Monthly security scan on 1st at 4 AM
0 4 1 * * rkhunter --check --cronjob --report-warnings-only

# SSL certificate renewal check twice daily
0 0,12 * * * certbot renew --quiet
```

## 📈 Scaling and Performance

### Vertical Scaling (Upgrade VPS)

#### Memory Upgrade:
```bash
# Before upgrading, check current usage
free -h
ps aux --sort=-%mem | head -10

# After VPS upgrade, optimize PM2
sudo -u atlas-ai pm2 delete all
sudo -u atlas-ai pm2 start /opt/atlas-ai/ecosystem.config.js

# Update PM2 configuration for more instances
sudo nano /opt/atlas-ai/ecosystem.config.js
# Increase instances count
```

#### Storage Upgrade:
```bash
# Check current usage
df -h

# After storage upgrade, extend filesystem
sudo resize2fs /dev/vda1  # Adjust device name as needed

# Move logs to separate partition (optional)
sudo mkdir /var/log/atlas-ai-old
sudo cp -r /var/log/atlas-ai/* /var/log/atlas-ai-old/
```

### Performance Optimization

#### Database Optimization:
```bash
# MongoDB performance tuning
sudo mongo atlas_ai
> db.runCommand({profile: 2})  # Enable profiling
> db.users.createIndex({username: 1})  # Create indexes
> db.conversations.createIndex({userId: 1, startTime: -1})

# Check slow queries
> db.system.profile.find().limit(5).sort({ts: -1}).pretty()
```

#### Nginx Optimization:
```bash
# Edit Nginx configuration
sudo nano /etc/nginx/sites-available/yourdomain.com

# Add performance optimizations:
# gzip compression
# static file caching
# connection limiting
# buffer sizes

sudo nginx -t && sudo systemctl reload nginx
```

## 📞 Support and Resources

### Getting Help

1. **Documentation**:
   - [Auto Install README](Auto%20Install/docs/README.md)
   - [Troubleshooting Guide](Auto%20Install/docs/TROUBLESHOOTING.md)

2. **Logs Location**:
   - Installation: `/var/log/atlas-ai/install.log`
   - Application: `/var/log/atlas-ai/application.log`
   - System: `/var/log/syslog`

3. **Community Support**:
   - GitHub Issues: Report bugs and get help
   - Discussions: Ask questions and share experiences

4. **Emergency Contacts**:
   - Save installation logs: `/tmp/atlas-install-debug.log`
   - Include system information when asking for help

### Useful Commands Reference

```bash
# Service management
sudo systemctl {start|stop|restart|status} {atlas-ai|nginx|mongod}

# Application management
sudo -u atlas-ai pm2 {start|stop|restart|status|logs}

# Health and monitoring
/opt/atlas-ai/scripts/health-check.sh
/opt/atlas-ai/scripts/monitor.sh
/opt/atlas-ai/scripts/backup.sh

# Updates and maintenance
/opt/atlas-ai/scripts/update.sh
/opt/atlas-ai/scripts/maintenance.sh

# SSL certificates
sudo certbot certificates
sudo certbot renew --dry-run

# Firewall
sudo ufw status verbose
sudo fail2ban-client status
```

---

🎉 **Congratulations!** Your Atlas AI application should now be running securely on your VPS with automatic SSL, monitoring, and backups configured.

For ongoing support and updates, bookmark this guide and join our community discussions.