#!/bin/bash

################################################################################
# Atlas AI Support Assistant - Backup Script
#
# This script performs comprehensive backups of:
# - MongoDB database
# - Application files
# - Configuration files
# - SSL certificates
# - Log files (optional)
#
# Author: Atlas AI Team
# Version: 1.0.0
################################################################################

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
readonly BACKUP_DIR="${BACKUP_DIR:-/var/backups/atlas-ai}"
readonly INSTALL_DIR="${INSTALL_DIR:-/opt/atlas-ai}"
readonly CONFIG_DIR="${CONFIG_DIR:-/etc/atlas-ai}"
readonly LOG_DIR="${LOG_DIR:-/var/log/atlas-ai}"

# Load configuration if available
if [[ -f "$CONFIG_DIR/backup.conf" ]]; then
    source "$CONFIG_DIR/backup.conf"
fi

# Default values
readonly TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
readonly DB_NAME="${DB_NAME:-atlas_ai}"
readonly DB_USER="${DB_USER:-atlas_user}"
readonly RETENTION_DAYS="${RETENTION_DAYS:-7}"
readonly COMPRESS_BACKUPS="${COMPRESS_BACKUPS:-true}"
readonly BACKUP_LOGS="${BACKUP_LOGS:-false}"
readonly REMOTE_BACKUP="${REMOTE_BACKUP:-false}"
readonly LOG_FILE="$LOG_DIR/backup.log"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m'

################################################################################
# Utility Functions
################################################################################

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

check_dependencies() {
    local deps=("mongodump" "tar" "gzip")

    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            error "Required dependency not found: $dep"
            exit 1
        fi
    done
}

ensure_backup_dir() {
    if [[ ! -d "$BACKUP_DIR" ]]; then
        mkdir -p "$BACKUP_DIR"
        log "Created backup directory: $BACKUP_DIR"
    fi
}

get_db_password() {
    if [[ -f "$CONFIG_DIR/secrets.txt" ]]; then
        grep "Database Password:" "$CONFIG_DIR/secrets.txt" | cut -d' ' -f3
    elif [[ -n "${DB_PASSWORD:-}" ]]; then
        echo "$DB_PASSWORD"
    else
        error "Database password not found"
        exit 1
    fi
}

################################################################################
# Backup Functions
################################################################################

backup_mongodb() {
    log "Starting MongoDB backup..."

    local db_password
    db_password=$(get_db_password)

    local backup_path="$BACKUP_DIR/mongodb_$TIMESTAMP"

    # Create MongoDB dump
    mongodump \
        --host localhost:27017 \
        --db "$DB_NAME" \
        --username "$DB_USER" \
        --password "$db_password" \
        --out "$backup_path" \
        --quiet

    if [[ "$COMPRESS_BACKUPS" == "true" ]]; then
        log "Compressing MongoDB backup..."
        tar -czf "$BACKUP_DIR/mongodb_backup_$TIMESTAMP.tar.gz" -C "$BACKUP_DIR" "mongodb_$TIMESTAMP"
        rm -rf "$backup_path"
        log "MongoDB backup compressed: mongodb_backup_$TIMESTAMP.tar.gz"
    else
        log "MongoDB backup completed: mongodb_$TIMESTAMP"
    fi
}

backup_application() {
    log "Starting application backup..."

    local app_backup_path="$BACKUP_DIR/app_backup_$TIMESTAMP"

    if [[ "$COMPRESS_BACKUPS" == "true" ]]; then
        tar -czf "$app_backup_path.tar.gz" \
            --exclude="node_modules" \
            --exclude="dist" \
            --exclude=".git" \
            --exclude="*.log" \
            -C "$(dirname "$INSTALL_DIR")" \
            "$(basename "$INSTALL_DIR")"
        log "Application backup compressed: app_backup_$TIMESTAMP.tar.gz"
    else
        cp -r "$INSTALL_DIR" "$app_backup_path"
        log "Application backup completed: app_backup_$TIMESTAMP"
    fi
}

backup_configuration() {
    log "Starting configuration backup..."

    local config_backup_path="$BACKUP_DIR/config_backup_$TIMESTAMP"

    # Create config backup directory
    mkdir -p "$config_backup_path"

    # Backup Atlas AI configuration
    if [[ -d "$CONFIG_DIR" ]]; then
        cp -r "$CONFIG_DIR" "$config_backup_path/atlas-ai"
    fi

    # Backup Nginx configuration
    if [[ -d "/etc/nginx/sites-available" ]]; then
        mkdir -p "$config_backup_path/nginx"
        cp /etc/nginx/sites-available/atlas-ai "$config_backup_path/nginx/" 2>/dev/null || true
        cp /etc/nginx/nginx.conf "$config_backup_path/nginx/" 2>/dev/null || true
    fi

    # Backup MongoDB configuration
    if [[ -f "/etc/mongod.conf" ]]; then
        mkdir -p "$config_backup_path/mongodb"
        cp /etc/mongod.conf "$config_backup_path/mongodb/"
    fi

    # Backup PM2 configuration
    if [[ -d "/home/atlas/.pm2" ]]; then
        mkdir -p "$config_backup_path/pm2"
        cp -r /home/atlas/.pm2/dump.pm2 "$config_backup_path/pm2/" 2>/dev/null || true
    fi

    if [[ "$COMPRESS_BACKUPS" == "true" ]]; then
        tar -czf "$BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz" -C "$BACKUP_DIR" "config_backup_$TIMESTAMP"
        rm -rf "$config_backup_path"
        log "Configuration backup compressed: config_backup_$TIMESTAMP.tar.gz"
    else
        log "Configuration backup completed: config_backup_$TIMESTAMP"
    fi
}

backup_ssl_certificates() {
    log "Starting SSL certificates backup..."

    local ssl_backup_path="$BACKUP_DIR/ssl_backup_$TIMESTAMP"

    if [[ -d "/etc/letsencrypt" ]]; then
        mkdir -p "$ssl_backup_path"
        cp -r /etc/letsencrypt "$ssl_backup_path/"

        if [[ "$COMPRESS_BACKUPS" == "true" ]]; then
            tar -czf "$BACKUP_DIR/ssl_backup_$TIMESTAMP.tar.gz" -C "$BACKUP_DIR" "ssl_backup_$TIMESTAMP"
            rm -rf "$ssl_backup_path"
            log "SSL certificates backup compressed: ssl_backup_$TIMESTAMP.tar.gz"
        else
            log "SSL certificates backup completed: ssl_backup_$TIMESTAMP"
        fi
    else
        warn "No SSL certificates found to backup"
    fi
}

backup_logs() {
    if [[ "$BACKUP_LOGS" != "true" ]]; then
        return 0
    fi

    log "Starting logs backup..."

    local logs_backup_path="$BACKUP_DIR/logs_backup_$TIMESTAMP"

    mkdir -p "$logs_backup_path"

    # Backup Atlas AI logs
    if [[ -d "$LOG_DIR" ]]; then
        cp -r "$LOG_DIR" "$logs_backup_path/atlas-ai"
    fi

    # Backup Nginx logs
    if [[ -d "/var/log/nginx" ]]; then
        mkdir -p "$logs_backup_path/nginx"
        cp /var/log/nginx/access.log* "$logs_backup_path/nginx/" 2>/dev/null || true
        cp /var/log/nginx/error.log* "$logs_backup_path/nginx/" 2>/dev/null || true
    fi

    # Backup MongoDB logs
    if [[ -d "/var/log/mongodb" ]]; then
        mkdir -p "$logs_backup_path/mongodb"
        cp /var/log/mongodb/mongod.log* "$logs_backup_path/mongodb/" 2>/dev/null || true
    fi

    if [[ "$COMPRESS_BACKUPS" == "true" ]]; then
        tar -czf "$BACKUP_DIR/logs_backup_$TIMESTAMP.tar.gz" -C "$BACKUP_DIR" "logs_backup_$TIMESTAMP"
        rm -rf "$logs_backup_path"
        log "Logs backup compressed: logs_backup_$TIMESTAMP.tar.gz"
    else
        log "Logs backup completed: logs_backup_$TIMESTAMP"
    fi
}

################################################################################
# Cleanup Functions
################################################################################

cleanup_old_backups() {
    log "Cleaning up old backups (keeping last $RETENTION_DAYS days)..."

    # Find and remove old backup files
    find "$BACKUP_DIR" -name "*backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    find "$BACKUP_DIR" -name "*backup_*" -type d -mtime +$RETENTION_DAYS -exec rm -rf {} + 2>/dev/null || true

    log "Old backups cleaned up"
}

################################################################################
# Remote Backup Functions
################################################################################

upload_to_remote() {
    if [[ "$REMOTE_BACKUP" != "true" ]]; then
        return 0
    fi

    log "Starting remote backup upload..."

    # Load remote backup configuration
    if [[ -f "$CONFIG_DIR/remote-backup.conf" ]]; then
        source "$CONFIG_DIR/remote-backup.conf"
    else
        warn "Remote backup enabled but no configuration found"
        return 1
    fi

    # Example: Upload to S3 (uncomment and configure)
    # if [[ -n "${AWS_S3_BUCKET:-}" ]]; then
    #     aws s3 sync "$BACKUP_DIR" "s3://$AWS_S3_BUCKET/atlas-ai-backups/" --exclude "*" --include "*$TIMESTAMP*"
    #     log "Backups uploaded to S3"
    # fi

    # Example: Upload via rsync (uncomment and configure)
    # if [[ -n "${REMOTE_HOST:-}" ]] && [[ -n "${REMOTE_PATH:-}" ]]; then
    #     rsync -avz --include "*$TIMESTAMP*" --exclude "*" "$BACKUP_DIR/" "$REMOTE_HOST:$REMOTE_PATH/"
    #     log "Backups uploaded via rsync"
    # fi

    warn "Remote backup configured but no upload method implemented"
}

################################################################################
# Verification Functions
################################################################################

verify_backups() {
    log "Verifying backup integrity..."

    local backup_files=(
        "$BACKUP_DIR/mongodb_backup_$TIMESTAMP.tar.gz"
        "$BACKUP_DIR/app_backup_$TIMESTAMP.tar.gz"
        "$BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz"
    )

    local all_verified=true

    for backup_file in "${backup_files[@]}"; do
        if [[ -f "$backup_file" ]]; then
            if tar -tzf "$backup_file" > /dev/null 2>&1; then
                log "✓ Verified: $(basename "$backup_file")"
            else
                error "✗ Corrupted: $(basename "$backup_file")"
                all_verified=false
            fi
        fi
    done

    if [[ "$all_verified" == "true" ]]; then
        log "All backups verified successfully"
    else
        error "Some backups failed verification"
        exit 1
    fi
}

################################################################################
# Notification Functions
################################################################################

send_notification() {
    local status="$1"
    local message="$2"

    # Load notification configuration
    if [[ -f "$CONFIG_DIR/notification.conf" ]]; then
        source "$CONFIG_DIR/notification.conf"
    fi

    # Send email notification (if configured)
    if [[ -n "${NOTIFICATION_EMAIL:-}" ]] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "Atlas AI Backup $status" "$NOTIFICATION_EMAIL"
    fi

    # Send webhook notification (if configured)
    if [[ -n "${WEBHOOK_URL:-}" ]] && command -v curl &> /dev/null; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\": \"Atlas AI Backup $status: $message\"}" \
            &> /dev/null || true
    fi
}

################################################################################
# Main Backup Process
################################################################################

main() {
    log "Starting Atlas AI backup process..."

    # Pre-flight checks
    check_dependencies
    ensure_backup_dir

    # Perform backups
    backup_mongodb
    backup_application
    backup_configuration
    backup_ssl_certificates
    backup_logs

    # Verify backups
    verify_backups

    # Upload to remote (if configured)
    upload_to_remote

    # Cleanup old backups
    cleanup_old_backups

    # Calculate backup size
    local backup_size
    backup_size=$(du -sh "$BACKUP_DIR" | cut -f1)

    log "Backup process completed successfully"
    log "Total backup size: $backup_size"

    # Send success notification
    send_notification "Success" "Backup completed successfully. Size: $backup_size"
}

# Error handling
trap 'error "Backup failed"; send_notification "Failed" "Backup process failed. Check logs for details."; exit 1' ERR

# Run main function
main "$@"