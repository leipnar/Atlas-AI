#!/bin/bash

# Atlas AI Update Script
# This script updates the Atlas AI application to the latest version

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/var/log/atlas-ai/update.log"
BACKUP_DIR="/var/backups/atlas-ai"
APP_DIR="/opt/atlas-ai"
SERVICE_NAME="atlas-ai"
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
    if [[ ! -f "$INSTALL_INFO_FILE" ]]; then
        error "Installation info file not found. Please run the installer first."
        exit 1
    fi

    source "$INSTALL_INFO_FILE"
    log "Loaded installation info from $INSTALL_INFO_FILE"
}

# Check current version
get_current_version() {
    if [[ -f "$APP_DIR/package.json" ]]; then
        CURRENT_VERSION=$(node -pe "require('$APP_DIR/package.json').version" 2>/dev/null || echo "unknown")
    else
        CURRENT_VERSION="unknown"
    fi
    log "Current version: $CURRENT_VERSION"
}

# Get latest version from repository
get_latest_version() {
    log "Checking for latest version..."

    if [[ -n "${REPO_URL:-}" ]]; then
        # Try to get version from GitHub API
        LATEST_VERSION=$(curl -s "https://api.github.com/repos/${REPO_URL#*github.com/}/releases/latest" | \
                        grep '"tag_name":' | \
                        sed -E 's/.*"([^"]+)".*/\1/' || echo "unknown")

        if [[ "$LATEST_VERSION" == "unknown" ]]; then
            # Fallback: get version from package.json in repository
            LATEST_VERSION=$(curl -s "https://raw.githubusercontent.com/${REPO_URL#*github.com/}/main/package.json" | \
                           grep '"version":' | \
                           head -1 | \
                           sed -E 's/.*"([^"]+)".*/\1/' || echo "unknown")
        fi
    else
        warning "Repository URL not found in installation info"
        LATEST_VERSION="unknown"
    fi

    log "Latest version: $LATEST_VERSION"
}

# Check if update is needed
check_update_needed() {
    if [[ "$CURRENT_VERSION" == "unknown" || "$LATEST_VERSION" == "unknown" ]]; then
        warning "Version comparison not possible"
        return 0
    fi

    if [[ "$CURRENT_VERSION" == "$LATEST_VERSION" ]]; then
        success "Atlas AI is already up to date (version $CURRENT_VERSION)"
        return 1
    fi

    log "Update available: $CURRENT_VERSION -> $LATEST_VERSION"
    return 0
}

# Create backup before update
create_backup() {
    log "Creating backup before update..."

    local backup_timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_path="$BACKUP_DIR/pre_update_$backup_timestamp"

    mkdir -p "$backup_path"

    # Backup application files
    if [[ -d "$APP_DIR" ]]; then
        tar -czf "$backup_path/app_backup.tar.gz" -C "$(dirname "$APP_DIR")" "$(basename "$APP_DIR")"
        log "Application files backed up to $backup_path/app_backup.tar.gz"
    fi

    # Backup database
    if command -v mongodump >/dev/null 2>&1; then
        mongodump --host localhost:27017 --db "${DB_NAME:-atlas_ai}" \
                 --username "${DB_USER:-atlas_user}" \
                 --password "${DB_PASSWORD:-}" \
                 --out "$backup_path/mongodb_backup" --quiet
        log "Database backed up to $backup_path/mongodb_backup"
    fi

    # Backup nginx configuration
    if [[ -f "/etc/nginx/sites-available/${DOMAIN:-atlas-ai}" ]]; then
        cp "/etc/nginx/sites-available/${DOMAIN:-atlas-ai}" "$backup_path/nginx.conf"
        log "Nginx configuration backed up"
    fi

    # Backup environment file
    if [[ -f "$APP_DIR/.env" ]]; then
        cp "$APP_DIR/.env" "$backup_path/env_backup"
        log "Environment configuration backed up"
    fi

    echo "$backup_path" > "/tmp/atlas_ai_last_backup"
    success "Backup created at $backup_path"
}

# Stop services
stop_services() {
    log "Stopping Atlas AI services..."

    # Stop PM2 processes
    if command -v pm2 >/dev/null 2>&1; then
        sudo -u atlas-ai pm2 stop all || true
        log "PM2 processes stopped"
    fi

    # Stop systemd service if exists
    if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
        systemctl stop "$SERVICE_NAME"
        log "Systemd service stopped"
    fi
}

# Start services
start_services() {
    log "Starting Atlas AI services..."

    # Start PM2 processes
    if command -v pm2 >/dev/null 2>&1 && [[ -f "$APP_DIR/ecosystem.config.js" ]]; then
        cd "$APP_DIR"
        sudo -u atlas-ai pm2 start ecosystem.config.js
        sudo -u atlas-ai pm2 save
        log "PM2 processes started"
    fi

    # Start systemd service if exists
    if systemctl list-unit-files | grep -q "^$SERVICE_NAME.service"; then
        systemctl start "$SERVICE_NAME"
        systemctl enable "$SERVICE_NAME"
        log "Systemd service started and enabled"
    fi

    # Restart nginx
    systemctl restart nginx
    log "Nginx restarted"
}

# Update application code
update_application() {
    log "Updating application code..."

    cd "$APP_DIR"

    # Pull latest changes
    if [[ -d ".git" ]]; then
        sudo -u atlas-ai git fetch origin
        sudo -u atlas-ai git reset --hard "origin/${GIT_BRANCH:-main}"
        log "Git repository updated"
    else
        error "Git repository not found in $APP_DIR"
        return 1
    fi

    # Install/update dependencies
    log "Installing dependencies..."
    sudo -u atlas-ai npm ci --production

    # Build application if needed
    if [[ -f "package.json" ]] && grep -q '"build"' package.json; then
        log "Building application..."
        sudo -u atlas-ai npm run build
    fi

    # Update frontend if needed
    if [[ -d "Front" ]]; then
        cd Front
        sudo -u atlas-ai npm ci
        sudo -u atlas-ai npm run build
        cd ..
        log "Frontend updated and built"
    fi

    success "Application code updated"
}

# Update database if needed
update_database() {
    log "Checking for database migrations..."

    # Run database migrations if script exists
    if [[ -f "$APP_DIR/scripts/migrate.js" ]]; then
        log "Running database migrations..."
        cd "$APP_DIR"
        sudo -u atlas-ai node scripts/migrate.js
        log "Database migrations completed"
    else
        log "No database migrations found"
    fi
}

# Update system packages
update_system_packages() {
    log "Updating system packages..."

    if command -v apt-get >/dev/null 2>&1; then
        apt-get update && apt-get upgrade -y
    elif command -v yum >/dev/null 2>&1; then
        yum update -y
    elif command -v dnf >/dev/null 2>&1; then
        dnf update -y
    else
        warning "Unknown package manager, skipping system update"
        return
    fi

    log "System packages updated"
}

# Update Node.js if needed
update_nodejs() {
    local required_version="${NODE_VERSION:-18}"
    local current_version=$(node --version 2>/dev/null | sed 's/v//' | cut -d. -f1 || echo "0")

    if [[ "$current_version" -lt "$required_version" ]]; then
        log "Updating Node.js to version $required_version..."

        # Install NodeSource repository and update Node.js
        curl -fsSL https://deb.nodesource.com/setup_${required_version}.x | bash -

        if command -v apt-get >/dev/null 2>&1; then
            apt-get install -y nodejs
        elif command -v yum >/dev/null 2>&1; then
            yum install -y nodejs
        elif command -v dnf >/dev/null 2>&1; then
            dnf install -y nodejs
        fi

        success "Node.js updated to $(node --version)"
    else
        log "Node.js is up to date ($(node --version))"
    fi
}

# Verify update
verify_update() {
    log "Verifying update..."

    # Check if services are running
    sleep 10  # Give services time to start

    local health_check_url="http://localhost:${BACKEND_PORT:-3001}/health"
    local max_attempts=5
    local attempt=1

    while [[ $attempt -le $max_attempts ]]; do
        if curl -sf "$health_check_url" >/dev/null 2>&1; then
            success "Health check passed (attempt $attempt/$max_attempts)"
            break
        else
            warning "Health check failed (attempt $attempt/$max_attempts)"
            if [[ $attempt -eq $max_attempts ]]; then
                error "Health check failed after $max_attempts attempts"
                return 1
            fi
            sleep 10
        fi
        ((attempt++))
    done

    # Check if frontend is accessible
    if [[ -n "${DOMAIN:-}" ]]; then
        if curl -sf "http://${DOMAIN}" >/dev/null 2>&1; then
            success "Frontend is accessible"
        else
            warning "Frontend accessibility check failed"
        fi
    fi

    success "Update verification completed"
}

# Rollback function
rollback() {
    error "Update failed, initiating rollback..."

    local last_backup_file="/tmp/atlas_ai_last_backup"
    if [[ ! -f "$last_backup_file" ]]; then
        error "No backup information found for rollback"
        return 1
    fi

    local backup_path=$(cat "$last_backup_file")
    if [[ ! -d "$backup_path" ]]; then
        error "Backup directory not found: $backup_path"
        return 1
    fi

    log "Rolling back from backup: $backup_path"

    # Stop services
    stop_services

    # Restore application files
    if [[ -f "$backup_path/app_backup.tar.gz" ]]; then
        rm -rf "$APP_DIR"
        tar -xzf "$backup_path/app_backup.tar.gz" -C "$(dirname "$APP_DIR")"
        log "Application files restored"
    fi

    # Restore database
    if [[ -d "$backup_path/mongodb_backup" ]]; then
        mongorestore --host localhost:27017 --db "${DB_NAME:-atlas_ai}" \
                    --username "${DB_USER:-atlas_user}" \
                    --password "${DB_PASSWORD:-}" \
                    --drop "$backup_path/mongodb_backup/${DB_NAME:-atlas_ai}"
        log "Database restored"
    fi

    # Restore nginx configuration
    if [[ -f "$backup_path/nginx.conf" ]]; then
        cp "$backup_path/nginx.conf" "/etc/nginx/sites-available/${DOMAIN:-atlas-ai}"
        log "Nginx configuration restored"
    fi

    # Restore environment file
    if [[ -f "$backup_path/env_backup" ]]; then
        cp "$backup_path/env_backup" "$APP_DIR/.env"
        log "Environment configuration restored"
    fi

    # Start services
    start_services

    success "Rollback completed"
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups..."

    # Keep only last 5 update backups
    find "$BACKUP_DIR" -name "pre_update_*" -type d | sort -r | tail -n +6 | xargs -r rm -rf

    log "Old backups cleaned up"
}

# Main update function
main() {
    log "Starting Atlas AI update process..."

    # Setup
    check_root
    load_install_info

    # Check versions
    get_current_version
    get_latest_version

    if ! check_update_needed; then
        exit 0
    fi

    # Confirm update
    if [[ "${FORCE_UPDATE:-false}" != "true" ]]; then
        echo -n "Do you want to update Atlas AI from $CURRENT_VERSION to $LATEST_VERSION? (y/N): "
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            log "Update cancelled by user"
            exit 0
        fi
    fi

    # Perform update
    trap rollback ERR

    create_backup
    update_system_packages
    update_nodejs
    stop_services
    update_application
    update_database
    start_services
    verify_update
    cleanup_old_backups

    trap - ERR

    success "Atlas AI updated successfully from $CURRENT_VERSION to $LATEST_VERSION"
    log "Update completed at $(date)"
}

# Handle command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE_UPDATE=true
            shift
            ;;
        --check-only)
            check_root
            load_install_info
            get_current_version
            get_latest_version
            check_update_needed
            exit $?
            ;;
        --rollback)
            check_root
            rollback
            exit 0
            ;;
        --help)
            echo "Atlas AI Update Script"
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --force       Force update without confirmation"
            echo "  --check-only  Only check for updates, don't install"
            echo "  --rollback    Rollback to previous version"
            echo "  --help        Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

# Run main function
main "$@"