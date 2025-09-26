# Atlas AI Troubleshooting Guide

This guide provides solutions to common issues you may encounter with the Atlas AI auto-installation system and deployed application.

## 📋 Table of Contents

- [Installation Issues](#installation-issues)
- [Service Issues](#service-issues)
- [SSL Certificate Issues](#ssl-certificate-issues)
- [Database Issues](#database-issues)
- [Performance Issues](#performance-issues)
- [Network Issues](#network-issues)
- [Security Issues](#security-issues)
- [Update Issues](#update-issues)
- [Backup Issues](#backup-issues)
- [Monitoring Issues](#monitoring-issues)
- [Diagnostic Tools](#diagnostic-tools)
- [Emergency Procedures](#emergency-procedures)

## 🚨 Installation Issues

### Installation Script Fails

**Symptoms:**
- Installation script exits with error
- Incomplete installation
- Services not starting

**Diagnostic Steps:**
```bash
# Check installation logs
tail -f /var/log/atlas-ai/install.log

# Check system requirements
df -h  # Check disk space
free -h  # Check memory
uname -a  # Check OS version

# Check internet connectivity
ping google.com
curl -I https://github.com
```

**Common Causes & Solutions:**

#### Insufficient Disk Space
```bash
# Check disk usage
df -h

# Clean up space
apt-get clean
apt-get autoremove -y
find /tmp -type f -mtime +7 -delete
```

#### Insufficient Memory
```bash
# Check memory
free -h

# Add swap if needed
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

#### Network Issues
```bash
# Test DNS resolution
nslookup google.com

# Check firewall
ufw status
iptables -L

# Test specific ports
telnet github.com 443
```

#### Package Manager Issues
```bash
# Ubuntu/Debian
apt-get update
apt-get install -f

# CentOS/RHEL
yum clean all
yum update
```

### Permission Errors

**Symptoms:**
- "Permission denied" errors
- File creation failures
- Service start failures

**Solutions:**
```bash
# Ensure running as root
sudo su -

# Fix ownership
chown -R atlas-ai:atlas-ai /opt/atlas-ai
chmod +x /opt/atlas-ai/scripts/*.sh

# Check SELinux (CentOS/RHEL)
sestatus
setenforce 0  # Temporary disable for testing
```

### Domain/DNS Issues

**Symptoms:**
- SSL certificate generation fails
- Domain not accessible
- DNS resolution errors

**Diagnostic Steps:**
```bash
# Check DNS resolution
nslookup yourdomain.com
dig yourdomain.com A

# Check domain accessibility
curl -I http://yourdomain.com
curl -I https://yourdomain.com
```

**Solutions:**
```bash
# Verify DNS A record points to server IP
# Wait for DNS propagation (up to 24 hours)
# Use alternative DNS servers for testing
nslookup yourdomain.com 8.8.8.8
```

## 🔧 Service Issues

### Atlas AI Service Not Starting

**Symptoms:**
- Service fails to start
- Application not accessible
- PM2 processes not running

**Diagnostic Steps:**
```bash
# Check service status
systemctl status atlas-ai
journalctl -u atlas-ai -f

# Check PM2 processes
sudo -u atlas-ai pm2 status
sudo -u atlas-ai pm2 logs

# Check application logs
tail -f /var/log/atlas-ai/application.log
```

**Common Solutions:**

#### Port Already in Use
```bash
# Check what's using the port
netstat -tlnp | grep :3001
lsof -i :3001

# Kill conflicting process
kill -9 <PID>
```

#### Environment Configuration Issues
```bash
# Check environment file
cat /opt/atlas-ai/.env

# Verify database connection
mongo atlas_ai --eval "db.stats()"

# Test environment variables
cd /opt/atlas-ai
sudo -u atlas-ai node -e "console.log(process.env.DATABASE_URL)"
```

#### Node.js/NPM Issues
```bash
# Check Node.js version
node --version
npm --version

# Reinstall dependencies
cd /opt/atlas-ai
sudo -u atlas-ai npm ci --production

# Clear npm cache
sudo -u atlas-ai npm cache clean --force
```

### Nginx Issues

**Symptoms:**
- Nginx fails to start
- 502 Bad Gateway errors
- SSL certificate errors

**Diagnostic Steps:**
```bash
# Check Nginx status
systemctl status nginx
nginx -t

# Check Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

**Solutions:**

#### Configuration Syntax Errors
```bash
# Test configuration
nginx -t

# Check specific site configuration
nginx -t -c /etc/nginx/sites-available/yourdomain.com
```

#### SSL Certificate Issues
```bash
# Check certificate files
ls -la /etc/letsencrypt/live/yourdomain.com/

# Test SSL configuration
openssl s_client -connect yourdomain.com:443
```

#### Upstream Connection Issues
```bash
# Check backend is running
curl http://localhost:3001/health

# Check proxy settings in Nginx config
grep -n "proxy_pass" /etc/nginx/sites-available/yourdomain.com
```

## 🔐 SSL Certificate Issues

### Certificate Generation Fails

**Symptoms:**
- Let's Encrypt fails
- HTTPS not working
- Certificate warnings

**Diagnostic Steps:**
```bash
# Check domain accessibility
curl -I http://yourdomain.com

# Check Certbot logs
tail -f /var/log/letsencrypt/letsencrypt.log

# Test certificate generation (dry run)
certbot certonly --nginx --dry-run -d yourdomain.com
```

**Solutions:**

#### Domain Not Accessible
```bash
# Ensure port 80 is open
ufw allow 80
ufw allow 443

# Check Nginx is serving on port 80
netstat -tlnp | grep :80
```

#### Rate Limiting
```bash
# Check Let's Encrypt rate limits
# Wait 1 hour and try again
# Use staging environment for testing
certbot certonly --nginx --staging -d yourdomain.com
```

### Certificate Renewal Issues

**Symptoms:**
- Certificate expired
- Renewal fails
- Browser warnings

**Solutions:**
```bash
# Manual renewal
certbot renew --dry-run
certbot renew --force-renewal

# Check automatic renewal
systemctl status certbot.timer
systemctl list-timers | grep certbot

# Test renewal hook
certbot renew --deploy-hook "systemctl reload nginx"
```

## 🗄️ Database Issues

### MongoDB Connection Failures

**Symptoms:**
- Database connection errors
- Authentication failures
- Application can't connect to DB

**Diagnostic Steps:**
```bash
# Check MongoDB status
systemctl status mongod
journalctl -u mongod -f

# Check MongoDB logs
tail -f /var/log/mongodb/mongod.log

# Test connection
mongo --host localhost:27017
```

**Solutions:**

#### MongoDB Not Running
```bash
# Start MongoDB
systemctl start mongod
systemctl enable mongod

# Check configuration
cat /etc/mongod.conf

# Check port binding
netstat -tlnp | grep :27017
```

#### Authentication Issues
```bash
# Check user credentials
mongo admin --eval "db.auth('admin', 'admin_password')"

# Reset user password
mongo admin
> db.auth('admin', 'current_admin_password')
> use atlas_ai
> db.updateUser('atlas_user', {pwd: 'new_password'})
```

#### Database Corruption
```bash
# Check database integrity
mongo atlas_ai --eval "db.runCommand({validate: 'users'})"

# Repair database
mongod --repair --dbpath /var/lib/mongodb
```

### Database Performance Issues

**Symptoms:**
- Slow query responses
- High CPU usage
- Memory issues

**Diagnostic Steps:**
```bash
# Check database statistics
mongo atlas_ai --eval "db.stats()"

# Check slow queries
mongo atlas_ai --eval "db.setProfilingLevel(2)"
mongo atlas_ai --eval "db.system.profile.find().limit(5).sort({ts:-1}).pretty()"

# Check indexes
mongo atlas_ai --eval "db.users.getIndexes()"
```

**Solutions:**
```bash
# Create missing indexes
mongo atlas_ai --eval "db.users.createIndex({username: 1})"
mongo atlas_ai --eval "db.conversations.createIndex({userId: 1, startTime: -1})"

# Compact database
mongo atlas_ai --eval "db.runCommand({compact: 'users'})"

# Optimize database
/opt/atlas-ai/scripts/maintenance.sh database
```

## ⚡ Performance Issues

### High CPU Usage

**Symptoms:**
- System sluggish
- High load average
- Application timeouts

**Diagnostic Steps:**
```bash
# Check CPU usage
top
htop
iostat 1

# Check specific processes
ps aux --sort=-%cpu | head -10

# Check PM2 processes
sudo -u atlas-ai pm2 monit
```

**Solutions:**
```bash
# Restart PM2 processes
sudo -u atlas-ai pm2 restart all

# Optimize PM2 configuration
sudo -u atlas-ai pm2 stop all
sudo -u atlas-ai pm2 start ecosystem.config.js

# Check for infinite loops in application
sudo -u atlas-ai pm2 logs --lines 100
```

### High Memory Usage

**Symptoms:**
- System running out of memory
- OOM killer activating
- Application crashes

**Diagnostic Steps:**
```bash
# Check memory usage
free -h
cat /proc/meminfo

# Check memory-intensive processes
ps aux --sort=-%mem | head -10

# Check for memory leaks
sudo -u atlas-ai pm2 monit
```

**Solutions:**
```bash
# Restart services to free memory
systemctl restart atlas-ai
sudo -u atlas-ai pm2 restart all

# Add swap space
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Optimize PM2 memory limits
# Edit ecosystem.config.js to add max_memory_restart
```

### Disk Space Issues

**Symptoms:**
- Disk full errors
- Application can't write files
- Database errors

**Diagnostic Steps:**
```bash
# Check disk usage
df -h
du -sh /var/log/* | sort -rh
du -sh /opt/atlas-ai/* | sort -rh
```

**Solutions:**
```bash
# Clean logs
/opt/atlas-ai/scripts/maintenance.sh logs

# Clean old backups
/opt/atlas-ai/scripts/maintenance.sh backups

# Clean package cache
apt-get clean
npm cache clean --force

# Remove old kernels (Ubuntu)
apt-get autoremove --purge -y
```

## 🌐 Network Issues

### Application Not Accessible

**Symptoms:**
- Can't reach application via domain
- Timeout errors
- Connection refused

**Diagnostic Steps:**
```bash
# Check if application is listening
netstat -tlnp | grep :3001
netstat -tlnp | grep :80
netstat -tlnp | grep :443

# Test local connectivity
curl http://localhost:3001/health
curl http://localhost

# Check firewall
ufw status verbose
iptables -L
```

**Solutions:**
```bash
# Open required ports
ufw allow 80
ufw allow 443
ufw allow ssh

# Check Nginx configuration
nginx -t
systemctl restart nginx

# Verify backend is running
systemctl status atlas-ai
sudo -u atlas-ai pm2 status
```

### Slow Response Times

**Symptoms:**
- High latency
- Timeouts
- Poor user experience

**Diagnostic Steps:**
```bash
# Test response times
curl -w "@curl-format.txt" -o /dev/null -s http://yourdomain.com

# Check network connectivity
ping yourdomain.com
traceroute yourdomain.com

# Monitor network traffic
iftop
nethogs
```

**Solutions:**
```bash
# Enable Nginx caching and compression
# Check Nginx configuration for:
# - gzip compression
# - static file caching
# - proxy buffering

# Optimize database queries
mongo atlas_ai --eval "db.setProfilingLevel(2)"

# Check for network bottlenecks
iperf3 -c speedtest.net
```

## 🛡️ Security Issues

### Fail2ban Not Working

**Symptoms:**
- Repeated failed login attempts
- No automatic IP blocking
- Security alerts not working

**Diagnostic Steps:**
```bash
# Check Fail2ban status
systemctl status fail2ban
fail2ban-client status

# Check specific jails
fail2ban-client status sshd
fail2ban-client status nginx-limit-req

# Check logs
tail -f /var/log/fail2ban.log
```

**Solutions:**
```bash
# Restart Fail2ban
systemctl restart fail2ban

# Check configuration
fail2ban-client get sshd bantime
fail2ban-client set sshd addignoreip your.ip.address

# Manually ban/unban IP
fail2ban-client set sshd banip malicious.ip.address
fail2ban-client set sshd unbanip mistaken.ip.address
```

### Firewall Issues

**Symptoms:**
- Services not accessible
- Connection timeouts
- Blocked legitimate traffic

**Diagnostic Steps:**
```bash
# Check firewall status
ufw status verbose
iptables -L -n

# Check recent blocks
journalctl -u ufw -f
dmesg | grep UFW
```

**Solutions:**
```bash
# Allow necessary services
ufw allow ssh
ufw allow 80
ufw allow 443

# Check for blocking rules
ufw --dry-run allow 80

# Reset firewall if needed
ufw --force reset
# Then reconfigure with proper rules
```

## 🔄 Update Issues

### Update Fails

**Symptoms:**
- Update script errors
- Application won't start after update
- Version mismatch issues

**Diagnostic Steps:**
```bash
# Check update logs
tail -f /var/log/atlas-ai/update.log

# Check current version
cd /opt/atlas-ai
node -pe "require('./package.json').version"

# Check git status
cd /opt/atlas-ai
git status
git log --oneline -5
```

**Solutions:**
```bash
# Rollback to previous version
/opt/atlas-ai/scripts/update.sh --rollback

# Force update
/opt/atlas-ai/scripts/update.sh --force

# Manual update
cd /opt/atlas-ai
sudo -u atlas-ai git fetch origin
sudo -u atlas-ai git reset --hard origin/main
sudo -u atlas-ai npm ci --production
sudo -u atlas-ai pm2 restart all
```

### Database Migration Issues

**Symptoms:**
- Database schema errors
- Missing collections
- Data corruption

**Solutions:**
```bash
# Check migration status
cd /opt/atlas-ai
ls -la scripts/migrations/

# Run migrations manually
sudo -u atlas-ai node scripts/migrate.js

# Restore from backup if needed
/opt/atlas-ai/scripts/restore.sh /var/backups/atlas-ai/latest_backup
```

## 💾 Backup Issues

### Backup Fails

**Symptoms:**
- Backup script errors
- Incomplete backups
- Storage issues

**Diagnostic Steps:**
```bash
# Check backup logs
tail -f /var/log/atlas-ai/backup.log

# Check backup directory
ls -la /var/backups/atlas-ai/

# Check disk space
df -h /var/backups/
```

**Solutions:**
```bash
# Clean old backups
/opt/atlas-ai/scripts/maintenance.sh backups

# Run backup manually
/opt/atlas-ai/scripts/backup.sh --type manual

# Check backup script permissions
chmod +x /opt/atlas-ai/scripts/backup.sh
```

### Restore Issues

**Symptoms:**
- Restore script fails
- Data inconsistency
- Service won't start after restore

**Solutions:**
```bash
# Stop services before restore
systemctl stop atlas-ai nginx

# Restore database manually
mongorestore --drop /var/backups/atlas-ai/latest/mongodb_backup/

# Restore application files
tar -xzf /var/backups/atlas-ai/latest/app_backup.tar.gz -C /opt/

# Start services
systemctl start atlas-ai nginx
```

## 📊 Monitoring Issues

### Health Checks Failing

**Symptoms:**
- Health check script errors
- False positive alerts
- Monitoring not working

**Diagnostic Steps:**
```bash
# Run health check manually
/opt/atlas-ai/scripts/health-check.sh

# Check health check logs
tail -f /var/log/atlas-ai/health-check.log

# Test individual components
curl http://localhost:3001/health
systemctl status nginx mongod atlas-ai
```

**Solutions:**
```bash
# Update health check thresholds
# Edit health-check.sh to adjust limits

# Fix health check permissions
chmod +x /opt/atlas-ai/scripts/health-check.sh

# Restart monitoring service
systemctl restart atlas-ai-monitor
```

## 🔧 Diagnostic Tools

### System Information
```bash
#!/bin/bash
# System diagnostic script

echo "=== System Information ==="
uname -a
lsb_release -a 2>/dev/null || cat /etc/os-release

echo -e "\n=== Resource Usage ==="
free -h
df -h
uptime

echo -e "\n=== Service Status ==="
systemctl status atlas-ai nginx mongod --no-pager

echo -e "\n=== Network Status ==="
netstat -tlnp | grep -E ":(80|443|3001|27017)"

echo -e "\n=== Process Information ==="
ps aux --sort=-%cpu | head -5
ps aux --sort=-%mem | head -5

echo -e "\n=== Log Summary ==="
echo "Recent errors:"
journalctl --since "1 hour ago" --priority=err --no-pager | tail -5
```

### Application Diagnostics
```bash
#!/bin/bash
# Application diagnostic script

echo "=== Atlas AI Diagnostics ==="

echo "Application Version:"
cd /opt/atlas-ai
node -pe "require('./package.json').version" 2>/dev/null || echo "Unknown"

echo -e "\nPM2 Status:"
sudo -u atlas-ai pm2 status

echo -e "\nEnvironment Check:"
cd /opt/atlas-ai
sudo -u atlas-ai node -e "
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
"

echo -e "\nDatabase Connection:"
timeout 5 mongo atlas_ai --quiet --eval "db.stats().ok" 2>/dev/null && echo "OK" || echo "FAILED"

echo -e "\nRecent Application Logs:"
tail -10 /var/log/atlas-ai/application.log 2>/dev/null || echo "No logs found"
```

### Network Diagnostics
```bash
#!/bin/bash
# Network diagnostic script

DOMAIN="${1:-localhost}"

echo "=== Network Diagnostics for $DOMAIN ==="

echo "DNS Resolution:"
nslookup "$DOMAIN" 2>/dev/null || echo "Failed"

echo -e "\nHTTP Test:"
curl -I "http://$DOMAIN" 2>/dev/null | head -1 || echo "Failed"

echo -e "\nHTTPS Test:"
curl -I "https://$DOMAIN" 2>/dev/null | head -1 || echo "Failed"

echo -e "\nSSL Certificate:"
if [[ "$DOMAIN" != "localhost" ]]; then
    echo | openssl s_client -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "Failed"
fi

echo -e "\nPort Status:"
netstat -tlnp | grep -E ":(80|443|3001)"
```

## 🚨 Emergency Procedures

### Complete System Recovery

1. **Stop all services:**
```bash
systemctl stop atlas-ai nginx mongod
sudo -u atlas-ai pm2 stop all
```

2. **Restore from backup:**
```bash
# Find latest backup
ls -lt /var/backups/atlas-ai/ | head -5

# Restore application
tar -xzf /var/backups/atlas-ai/latest/app_backup.tar.gz -C /opt/

# Restore database
mongorestore --drop /var/backups/atlas-ai/latest/mongodb_backup/

# Restore configuration
cp /var/backups/atlas-ai/latest/nginx.conf /etc/nginx/sites-available/yourdomain.com
cp /var/backups/atlas-ai/latest/env_backup /opt/atlas-ai/.env
```

3. **Start services:**
```bash
systemctl start mongod
systemctl start nginx
systemctl start atlas-ai
```

4. **Verify functionality:**
```bash
/opt/atlas-ai/scripts/health-check.sh
curl http://localhost:3001/health
```

### Emergency Contact Information

If you need immediate assistance:

1. **Check Documentation**: Review this troubleshooting guide
2. **Check Logs**: Review application and system logs
3. **Run Diagnostics**: Use the diagnostic scripts provided
4. **Create Issue**: Submit detailed issue with logs and error messages
5. **Community Support**: Check community forums for similar issues

### Emergency Script
Save this as `/opt/atlas-ai/scripts/emergency.sh`:

```bash
#!/bin/bash
# Emergency diagnostic and recovery script

echo "Atlas AI Emergency Diagnostic"
echo "============================="

# Collect system information
echo "System Info:" > /tmp/atlas-emergency.log
uname -a >> /tmp/atlas-emergency.log
date >> /tmp/atlas-emergency.log

# Service status
echo -e "\nServices:" >> /tmp/atlas-emergency.log
systemctl status atlas-ai nginx mongod --no-pager >> /tmp/atlas-emergency.log 2>&1

# Recent logs
echo -e "\nRecent Errors:" >> /tmp/atlas-emergency.log
journalctl --since "1 hour ago" --priority=err --no-pager >> /tmp/atlas-emergency.log

# Application logs
echo -e "\nApplication Logs:" >> /tmp/atlas-emergency.log
tail -50 /var/log/atlas-ai/application.log >> /tmp/atlas-emergency.log 2>&1

echo "Emergency diagnostic saved to /tmp/atlas-emergency.log"
echo "Please include this file when seeking support."

# Attempt automatic recovery
read -p "Attempt automatic recovery? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Attempting recovery..."
    systemctl restart atlas-ai nginx mongod
    sleep 10
    /opt/atlas-ai/scripts/health-check.sh
fi
```

---

For additional support, please include relevant log files and system information when reporting issues.