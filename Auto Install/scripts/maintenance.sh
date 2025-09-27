#!/bin/bash

# Atlas AI Maintenance Script
# This script performs regular maintenance tasks for the Atlas AI application

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/var/log/atlas-ai/maintenance.log"
APP_DIR="/opt/atlas-ai"
BACKUP_DIR="/var/backups/atlas-ai"
INSTALL_INFO_FILE="/opt/atlas-ai/.install_info"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[${timestamp}]${NC} $message"
    echo "[${timestamp}] $message" >> "$LOG_FILE"
}

error() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[${timestamp}] ERROR:${NC} $message" >&2
    echo "[${timestamp}] ERROR: $message" >> "$LOG_FILE"
}

success() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[${timestamp}] SUCCESS:${NC} $message"
    echo "[${timestamp}] SUCCESS: $message" >> "$LOG_FILE"
}

warning() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[${timestamp}] WARNING:${NC} $message"
    echo "[${timestamp}] WARNING: $message" >> "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
        exit 1
    fi
}

# Load installation info
load_install_info() {
    if [[ -f "$INSTALL_INFO_FILE" ]]; then
        source "$INSTALL_INFO_FILE"
        log "Loaded installation info from $INSTALL_INFO_FILE"
    else
        warning "Installation info file not found, using defaults"
        DB_NAME="atlas_ai"
        DB_USER="atlas_user"
        DOMAIN="localhost"
    fi
}

# Clean up old log files
cleanup_logs() {
    log "Cleaning up old log files..."

    # Rotate and compress old log files
    find /var/log/atlas-ai -name "*.log" -type f -mtime +7 -exec gzip {} \;
    find /var/log/atlas-ai -name "*.log.gz" -type f -mtime +30 -delete

    # Clean PM2 logs
    if command -v pm2 >/dev/null 2>&1; then
        sudo -u atlas-ai pm2 flush || true
        log "PM2 logs flushed"
    fi

    # Clean nginx logs older than 30 days
    find /var/log/nginx -name "*.log" -type f -mtime +30 -delete 2>/dev/null || true

    success "Log cleanup completed"
}

# Clean up old backup files
cleanup_backups() {
    log "Cleaning up old backup files..."

    # Keep only last 14 daily backups
    find "$BACKUP_DIR" -name "daily_*" -type d | sort -r | tail -n +15 | xargs -r rm -rf

    # Keep only last 4 weekly backups
    find "$BACKUP_DIR" -name "weekly_*" -type d | sort -r | tail -n +5 | xargs -r rm -rf

    # Keep only last 12 monthly backups
    find "$BACKUP_DIR" -name "monthly_*" -type d | sort -r | tail -n +13 | xargs -r rm -rf

    # Clean up pre-update backups older than 30 days
    find "$BACKUP_DIR" -name "pre_update_*" -type d -mtime +30 -exec rm -rf {} \;

    success "Backup cleanup completed"
}

# Optimize MongoDB database
optimize_database() {
    log "Optimizing MongoDB database..."

    if ! command -v mongo >/dev/null 2>&1; then
        warning "MongoDB client not found, skipping database optimization"
        return
    fi

    # Compact database collections
    local collections=("users" "knowledge_base" "conversations" "application_config")

    for collection in "${collections[@]}"; do
        log "Compacting collection: $collection"
        mongo --quiet "${DB_NAME}" --eval "db.runCommand({compact: '$collection'})" || true
    done

    # Rebuild indexes
    log "Rebuilding database indexes..."
    mongo --quiet "${DB_NAME}" --eval "db.runCommand({reIndex: 'users'})" || true
    mongo --quiet "${DB_NAME}" --eval "db.runCommand({reIndex: 'knowledge_base'})" || true
    mongo --quiet "${DB_NAME}" --eval "db.runCommand({reIndex: 'conversations'})" || true

    # Get database statistics
    local db_stats=$(mongo --quiet "${DB_NAME}" --eval "printjson(db.stats())" || echo "{}")
    log "Database statistics: $db_stats"

    success "Database optimization completed"
}

# Update SSL certificates
update_ssl_certificates() {
    log "Checking SSL certificates..."

    if ! command -v certbot >/dev/null 2>&1; then
        warning "Certbot not found, skipping SSL certificate update"
        return
    fi

    # Check certificate expiration
    local cert_path="/etc/letsencrypt/live/${DOMAIN}/cert.pem"

    if [[ -f "$cert_path" ]]; then
        local expiry_date=$(openssl x509 -enddate -noout -in "$cert_path" | cut -d= -f2)
        local expiry_epoch=$(date -d "$expiry_date" +%s)
        local current_epoch=$(date +%s)
        local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))

        log "SSL certificate expires in $days_until_expiry days"

        if [[ $days_until_expiry -lt 30 ]]; then
            log "Renewing SSL certificate..."
            certbot renew --quiet --nginx
            systemctl reload nginx
            success "SSL certificate renewed"
        else
            log "SSL certificate is valid"
        fi
    else
        warning "SSL certificate not found at $cert_path"
    fi
}

# Update system packages
update_system() {
    log "Updating system packages..."

    if command -v apt-get >/dev/null 2>&1; then
        apt-get update
        DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
        apt-get autoremove -y
        apt-get autoclean
    elif command -v yum >/dev/null 2>&1; then
        yum update -y
        yum autoremove -y
        yum clean all
    elif command -v dnf >/dev/null 2>&1; then
        dnf update -y
        dnf autoremove -y
        dnf clean all
    else
        warning "Unknown package manager, skipping system update"
        return
    fi

    success "System packages updated"
}

# Check disk space
check_disk_space() {
    log "Checking disk space..."

    local usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    log "Root filesystem usage: ${usage}%"

    if [[ $usage -gt 85 ]]; then
        warning "High disk usage detected: ${usage}%"

        # Try to free up space
        log "Attempting to free up disk space..."

        # Clean package cache
        if command -v apt-get >/dev/null 2>&1; then
            apt-get clean
        elif command -v yum >/dev/null 2>&1; then
            yum clean all
        elif command -v dnf >/dev/null 2>&1; then
            dnf clean all
        fi

        # Clean temporary files
        find /tmp -type f -mtime +7 -delete 2>/dev/null || true
        find /var/tmp -type f -mtime +7 -delete 2>/dev/null || true

        # Clean old kernels (Ubuntu/Debian)
        if command -v apt-get >/dev/null 2>&1; then
            apt-get autoremove --purge -y
        fi

        local new_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
        log "Disk usage after cleanup: ${new_usage}%"
    else
        success "Disk space usage is acceptable: ${usage}%"
    fi
}

# Check memory usage
check_memory() {
    log "Checking memory usage..."

    local mem_info=$(free -m)
    local total_mem=$(echo "$mem_info" | awk 'NR==2{print $2}')
    local used_mem=$(echo "$mem_info" | awk 'NR==2{print $3}')
    local usage_percent=$((used_mem * 100 / total_mem))

    log "Memory usage: ${used_mem}MB/${total_mem}MB (${usage_percent}%)"

    if [[ $usage_percent -gt 85 ]]; then
        warning "High memory usage detected: ${usage_percent}%"

        # Restart PM2 processes to free memory
        if command -v pm2 >/dev/null 2>&1; then
            log "Restarting PM2 processes to free memory..."
            sudo -u atlas-ai pm2 restart all
            success "PM2 processes restarted"
        fi
    else
        success "Memory usage is acceptable: ${usage_percent}%"
    fi
}

# Optimize PM2 processes
optimize_pm2() {
    log "Optimizing PM2 processes..."

    if ! command -v pm2 >/dev/null 2>&1; then
        warning "PM2 not found, skipping optimization"
        return
    fi

    # Get PM2 status
    local pm2_status=$(sudo -u atlas-ai pm2 jlist 2>/dev/null || echo "[]")
    log "Current PM2 status: $pm2_status"

    # Restart processes that have been running for more than 24 hours
    local restart_threshold=$((24 * 60 * 60 * 1000))  # 24 hours in milliseconds
    local current_time=$(date +%s%3N)

    while read -r process_data; do
        if [[ -n "$process_data" ]]; then
            local process_name=$(echo "$process_data" | jq -r '.name')
            local uptime=$(echo "$process_data" | jq -r '.pm2_env.pm_uptime')

            if [[ "$uptime" != "null" && $((current_time - uptime)) -gt $restart_threshold ]]; then
                log "Restarting long-running process: $process_name"
                sudo -u atlas-ai pm2 restart "$process_name"
            fi
        fi
    done < <(echo "$pm2_status" | jq -c '.[]')

    # Clean PM2 dumps older than 7 days
    sudo -u atlas-ai find ~/.pm2/dumps -name "*.json" -type f -mtime +7 -delete 2>/dev/null || true

    success "PM2 optimization completed"
}

# Check service health
check_services() {
    log "Checking service health..."

    local services=("nginx" "mongod" "atlas-ai")
    local failed_services=()

    for service in "${services[@]}"; do
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            success "Service $service is running"
        else
            warning "Service $service is not running"
            failed_services+=("$service")
        fi
    done

    # Try to restart failed services
    for service in "${failed_services[@]}"; do
        log "Attempting to restart service: $service"
        systemctl restart "$service" && success "Service $service restarted" || error "Failed to restart service $service"
    done
}

# Generate maintenance report
generate_report() {
    log "Generating maintenance report..."

    local report_file="/var/log/atlas-ai/maintenance_report_$(date +%Y%m%d).txt"

    {
        echo "Atlas AI Maintenance Report"
        echo "=========================="
        echo "Date: $(date)"
        echo ""
        echo "System Information:"
        echo "- OS: $(lsb_release -d | cut -f2- 2>/dev/null || uname -a)"
        echo "- Uptime: $(uptime)"
        echo "- Load: $(cat /proc/loadavg)"
        echo ""
        echo "Disk Usage:"
        df -h
        echo ""
        echo "Memory Usage:"
        free -h
        echo ""
        echo "Top Processes:"
        ps aux --sort=-%cpu | head -10
        echo ""
        echo "Service Status:"
        systemctl status nginx mongod atlas-ai --no-pager -l
        echo ""
        echo "Recent Errors (last 24 hours):"
        journalctl --since "24 hours ago" --priority=err --no-pager | tail -20
        echo ""
        echo "Atlas AI Logs (last 50 lines):"
        tail -50 "$LOG_FILE" 2>/dev/null || echo "No log file found"
    } > "$report_file"

    success "Maintenance report generated: $report_file"
}

# Send notification
send_notification() {
    local subject="$1"
    local message="$2"

    # Try to send email notification if configured
    if command -v mail >/dev/null 2>&1 && [[ -n "${ADMIN_EMAIL:-}" ]]; then
        echo "$message" | mail -s "$subject" "$ADMIN_EMAIL" || warning "Failed to send email notification"
    fi

    # Log the notification
    log "NOTIFICATION: $subject - $message"
}

# Main maintenance function
main() {
    local task="${1:-all}"

    log "Starting Atlas AI maintenance (task: $task)..."

    check_root
    load_install_info

    case "$task" in
        "logs")
            cleanup_logs
            ;;
        "backups")
            cleanup_backups
            ;;
        "database")
            optimize_database
            ;;
        "ssl")
            update_ssl_certificates
            ;;
        "system")
            update_system
            ;;
        "disk")
            check_disk_space
            ;;
        "memory")
            check_memory
            ;;
        "pm2")
            optimize_pm2
            ;;
        "services")
            check_services
            ;;
        "report")
            generate_report
            ;;
        "all")
            cleanup_logs
            cleanup_backups
            optimize_database
            update_ssl_certificates
            check_disk_space
            check_memory
            optimize_pm2
            check_services
            generate_report
            ;;
        *)
            error "Unknown maintenance task: $task"
            echo "Available tasks: logs, backups, database, ssl, system, disk, memory, pm2, services, report, all"
            exit 1
            ;;
    esac

    success "Maintenance task '$task' completed successfully"
    send_notification "Atlas AI Maintenance Completed" "Maintenance task '$task' completed successfully at $(date)"
}

# Handle command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --help)
            echo "Atlas AI Maintenance Script"
            echo "Usage: $0 [TASK] [OPTIONS]"
            echo ""
            echo "Tasks:"
            echo "  all       Run all maintenance tasks (default)"
            echo "  logs      Clean up old log files"
            echo "  backups   Clean up old backup files"
            echo "  database  Optimize MongoDB database"
            echo "  ssl       Update SSL certificates"
            echo "  system    Update system packages"
            echo "  disk      Check and optimize disk space"
            echo "  memory    Check memory usage"
            echo "  pm2       Optimize PM2 processes"
            echo "  services  Check service health"
            echo "  report    Generate maintenance report"
            echo ""
            echo "Options:"
            echo "  --help    Show this help message"
            exit 0
            ;;
        *)
            break
            ;;
    esac
done

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

# Run main function
main "$@"