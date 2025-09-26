#!/bin/bash

################################################################################
# Atlas AI Support Assistant - Health Check Script
#
# This script monitors the health of all Atlas AI components:
# - Backend API server
# - Frontend web interface
# - MongoDB database
# - Nginx web server
# - System resources
#
# Author: Atlas AI Team
# Version: 1.0.0
################################################################################

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
readonly CONFIG_DIR="${CONFIG_DIR:-/etc/atlas-ai}"
readonly LOG_DIR="${LOG_DIR:-/var/log/atlas-ai}"
readonly LOG_FILE="$LOG_DIR/health-check.log"

# Load configuration if available
if [[ -f "$CONFIG_DIR/health-check.conf" ]]; then
    source "$CONFIG_DIR/health-check.conf"
fi

# Default configuration
readonly BACKEND_PORT="${BACKEND_PORT:-3001}"
readonly DOMAIN="${DOMAIN:-localhost}"
readonly MAX_RESPONSE_TIME="${MAX_RESPONSE_TIME:-5}"
readonly MAX_CPU_USAGE="${MAX_CPU_USAGE:-80}"
readonly MAX_MEMORY_USAGE="${MAX_MEMORY_USAGE:-80}"
readonly MAX_DISK_USAGE="${MAX_DISK_USAGE:-85}"
readonly ENABLE_ALERTS="${ENABLE_ALERTS:-true}"
readonly RESTART_ON_FAILURE="${RESTART_ON_FAILURE:-true}"

# Health check state
readonly STATE_FILE="$LOG_DIR/health-state.json"
readonly ALERT_COOLDOWN=300 # 5 minutes

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

get_timestamp() {
    date +%s
}

update_state() {
    local component="$1"
    local status="$2"
    local timestamp="$3"
    local message="$4"

    # Create state file if it doesn't exist
    if [[ ! -f "$STATE_FILE" ]]; then
        echo '{}' > "$STATE_FILE"
    fi

    # Update component state
    jq --arg comp "$component" --arg stat "$status" --arg ts "$timestamp" --arg msg "$message" \
        '.[$comp] = {status: $stat, timestamp: ($ts | tonumber), message: $msg}' \
        "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
}

get_last_alert_time() {
    local component="$1"

    if [[ -f "$STATE_FILE" ]]; then
        jq -r --arg comp "$component" '.[$comp].last_alert // 0' "$STATE_FILE"
    else
        echo "0"
    fi
}

should_send_alert() {
    local component="$1"
    local current_time="$2"
    local last_alert_time

    last_alert_time=$(get_last_alert_time "$component")

    if [[ $((current_time - last_alert_time)) -gt $ALERT_COOLDOWN ]]; then
        return 0
    else
        return 1
    fi
}

send_alert() {
    local component="$1"
    local message="$2"
    local current_time="$3"

    if [[ "$ENABLE_ALERTS" != "true" ]]; then
        return 0
    fi

    if ! should_send_alert "$component" "$current_time"; then
        return 0
    fi

    # Update last alert time
    jq --arg comp "$component" --arg ts "$current_time" \
        '.[$comp].last_alert = ($ts | tonumber)' \
        "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"

    # Load notification configuration
    if [[ -f "$CONFIG_DIR/notification.conf" ]]; then
        source "$CONFIG_DIR/notification.conf"
    fi

    # Send email alert
    if [[ -n "${ALERT_EMAIL:-}" ]] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "Atlas AI Health Alert: $component" "$ALERT_EMAIL"
    fi

    # Send webhook alert
    if [[ -n "${ALERT_WEBHOOK_URL:-}" ]] && command -v curl &> /dev/null; then
        curl -X POST "$ALERT_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\": \"Atlas AI Health Alert: $component - $message\"}" \
            &> /dev/null || true
    fi

    log "Alert sent for $component: $message"
}

################################################################################
# Health Check Functions
################################################################################

check_backend() {
    local component="backend"
    local timestamp
    timestamp=$(get_timestamp)

    log "Checking backend health..."

    # Check if backend is running
    if ! pgrep -f "atlas-backend" > /dev/null; then
        error "Backend process not found"
        update_state "$component" "DOWN" "$timestamp" "Process not running"

        if [[ "$RESTART_ON_FAILURE" == "true" ]]; then
            log "Attempting to restart backend..."
            pm2 restart atlas-backend || systemctl restart atlas-ai
            sleep 10
        fi

        send_alert "$component" "Backend service is down and restart was attempted" "$timestamp"
        return 1
    fi

    # Check backend health endpoint
    local response_time
    if response_time=$(curl -w "%{time_total}" -s -o /dev/null --max-time "$MAX_RESPONSE_TIME" "http://localhost:$BACKEND_PORT/health"); then
        if (( $(echo "$response_time > $MAX_RESPONSE_TIME" | bc -l) )); then
            warn "Backend responding slowly: ${response_time}s"
            update_state "$component" "SLOW" "$timestamp" "Response time: ${response_time}s"
            send_alert "$component" "Backend is responding slowly (${response_time}s)" "$timestamp"
        else
            log "Backend OK (${response_time}s)"
            update_state "$component" "OK" "$timestamp" "Response time: ${response_time}s"
        fi
    else
        error "Backend health check failed"
        update_state "$component" "UNHEALTHY" "$timestamp" "Health endpoint not responding"

        if [[ "$RESTART_ON_FAILURE" == "true" ]]; then
            log "Attempting to restart backend..."
            pm2 restart atlas-backend
            sleep 10
        fi

        send_alert "$component" "Backend health endpoint not responding" "$timestamp"
        return 1
    fi
}

check_frontend() {
    local component="frontend"
    local timestamp
    timestamp=$(get_timestamp)

    log "Checking frontend health..."

    # Determine URL scheme
    local url_scheme="http"
    if [[ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
        url_scheme="https"
    fi

    local frontend_url="$url_scheme://$DOMAIN"

    # Check frontend accessibility
    local response_code
    if response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$MAX_RESPONSE_TIME" "$frontend_url"); then
        if [[ "$response_code" == "200" ]]; then
            log "Frontend OK"
            update_state "$component" "OK" "$timestamp" "HTTP $response_code"
        else
            warn "Frontend returned HTTP $response_code"
            update_state "$component" "WARNING" "$timestamp" "HTTP $response_code"
            send_alert "$component" "Frontend returned HTTP $response_code" "$timestamp"
        fi
    else
        error "Frontend not accessible"
        update_state "$component" "DOWN" "$timestamp" "Not accessible"

        if [[ "$RESTART_ON_FAILURE" == "true" ]]; then
            log "Attempting to restart Nginx..."
            systemctl restart nginx
            sleep 5
        fi

        send_alert "$component" "Frontend not accessible" "$timestamp"
        return 1
    fi
}

check_mongodb() {
    local component="mongodb"
    local timestamp
    timestamp=$(get_timestamp)

    log "Checking MongoDB health..."

    # Check if MongoDB process is running
    if ! pgrep mongod > /dev/null; then
        error "MongoDB process not found"
        update_state "$component" "DOWN" "$timestamp" "Process not running"

        if [[ "$RESTART_ON_FAILURE" == "true" ]]; then
            log "Attempting to restart MongoDB..."
            systemctl restart mongod
            sleep 10
        fi

        send_alert "$component" "MongoDB service is down" "$timestamp"
        return 1
    fi

    # Check MongoDB connectivity
    if mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        log "MongoDB OK"
        update_state "$component" "OK" "$timestamp" "Ping successful"
    else
        error "MongoDB ping failed"
        update_state "$component" "UNHEALTHY" "$timestamp" "Ping failed"

        if [[ "$RESTART_ON_FAILURE" == "true" ]]; then
            log "Attempting to restart MongoDB..."
            systemctl restart mongod
            sleep 10
        fi

        send_alert "$component" "MongoDB ping failed" "$timestamp"
        return 1
    fi
}

check_nginx() {
    local component="nginx"
    local timestamp
    timestamp=$(get_timestamp)

    log "Checking Nginx health..."

    # Check if Nginx is running
    if ! pgrep nginx > /dev/null; then
        error "Nginx process not found"
        update_state "$component" "DOWN" "$timestamp" "Process not running"

        if [[ "$RESTART_ON_FAILURE" == "true" ]]; then
            log "Attempting to restart Nginx..."
            systemctl restart nginx
            sleep 5
        fi

        send_alert "$component" "Nginx service is down" "$timestamp"
        return 1
    fi

    # Check Nginx configuration
    if nginx -t > /dev/null 2>&1; then
        log "Nginx configuration OK"
        update_state "$component" "OK" "$timestamp" "Configuration valid"
    else
        error "Nginx configuration invalid"
        update_state "$component" "ERROR" "$timestamp" "Configuration invalid"
        send_alert "$component" "Nginx configuration is invalid" "$timestamp"
        return 1
    fi
}

################################################################################
# System Resource Checks
################################################################################

check_system_resources() {
    local timestamp
    timestamp=$(get_timestamp)

    log "Checking system resources..."

    # Check CPU usage
    local cpu_usage
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')

    if (( $(echo "$cpu_usage > $MAX_CPU_USAGE" | bc -l) )); then
        warn "High CPU usage: ${cpu_usage}%"
        update_state "cpu" "HIGH" "$timestamp" "Usage: ${cpu_usage}%"
        send_alert "cpu" "High CPU usage: ${cpu_usage}%" "$timestamp"
    else
        update_state "cpu" "OK" "$timestamp" "Usage: ${cpu_usage}%"
    fi

    # Check memory usage
    local memory_usage
    memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')

    if (( $(echo "$memory_usage > $MAX_MEMORY_USAGE" | bc -l) )); then
        warn "High memory usage: ${memory_usage}%"
        update_state "memory" "HIGH" "$timestamp" "Usage: ${memory_usage}%"
        send_alert "memory" "High memory usage: ${memory_usage}%" "$timestamp"
    else
        update_state "memory" "OK" "$timestamp" "Usage: ${memory_usage}%"
    fi

    # Check disk usage
    local disk_usage
    disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

    if [[ $disk_usage -gt $MAX_DISK_USAGE ]]; then
        warn "High disk usage: ${disk_usage}%"
        update_state "disk" "HIGH" "$timestamp" "Usage: ${disk_usage}%"
        send_alert "disk" "High disk usage: ${disk_usage}%" "$timestamp"
    else
        update_state "disk" "OK" "$timestamp" "Usage: ${disk_usage}%"
    fi

    log "System resources: CPU ${cpu_usage}%, Memory ${memory_usage}%, Disk ${disk_usage}%"
}

################################################################################
# SSL Certificate Check
################################################################################

check_ssl_certificates() {
    local component="ssl"
    local timestamp
    timestamp=$(get_timestamp)

    if [[ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
        log "No SSL certificates found"
        return 0
    fi

    log "Checking SSL certificates..."

    # Check certificate expiration
    local expiry_date
    expiry_date=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" | cut -d= -f2)
    local expiry_timestamp
    expiry_timestamp=$(date -d "$expiry_date" +%s)
    local current_timestamp
    current_timestamp=$(date +%s)
    local days_until_expiry
    days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))

    if [[ $days_until_expiry -lt 30 ]]; then
        if [[ $days_until_expiry -lt 7 ]]; then
            error "SSL certificate expires in $days_until_expiry days"
            update_state "$component" "CRITICAL" "$timestamp" "Expires in $days_until_expiry days"
            send_alert "$component" "SSL certificate expires in $days_until_expiry days" "$timestamp"
        else
            warn "SSL certificate expires in $days_until_expiry days"
            update_state "$component" "WARNING" "$timestamp" "Expires in $days_until_expiry days"
            send_alert "$component" "SSL certificate expires in $days_until_expiry days" "$timestamp"
        fi
    else
        log "SSL certificate OK (expires in $days_until_expiry days)"
        update_state "$component" "OK" "$timestamp" "Expires in $days_until_expiry days"
    fi
}

################################################################################
# Database Integrity Check
################################################################################

check_database_integrity() {
    local component="database"
    local timestamp
    timestamp=$(get_timestamp)

    log "Checking database integrity..."

    # Get database password
    local db_password
    if [[ -f "$CONFIG_DIR/secrets.txt" ]]; then
        db_password=$(grep "Database Password:" "$CONFIG_DIR/secrets.txt" | cut -d' ' -f3)
    else
        warn "Cannot check database integrity: password not found"
        return 0
    fi

    # Check database statistics
    local db_stats
    if db_stats=$(mongosh --quiet --eval "db.stats()" atlas_ai --username atlas_user --password "$db_password" 2>/dev/null); then
        local db_size
        db_size=$(echo "$db_stats" | grep -o '"dataSize" : [0-9]*' | cut -d: -f2 | tr -d ' ')

        log "Database OK (size: $((db_size / 1024 / 1024)) MB)"
        update_state "$component" "OK" "$timestamp" "Size: $((db_size / 1024 / 1024)) MB"
    else
        error "Database integrity check failed"
        update_state "$component" "ERROR" "$timestamp" "Statistics query failed"
        send_alert "$component" "Database integrity check failed" "$timestamp"
        return 1
    fi
}

################################################################################
# Generate Health Report
################################################################################

generate_health_report() {
    log "Generating health report..."

    if [[ ! -f "$STATE_FILE" ]]; then
        warn "No health state file found"
        return 0
    fi

    # Create health report
    local report_file="$LOG_DIR/health-report-$(date +%Y%m%d).json"

    jq --arg timestamp "$(get_timestamp)" \
        '. + {generated: ($timestamp | tonumber), report_date: (now | strftime("%Y-%m-%d %H:%M:%S"))}' \
        "$STATE_FILE" > "$report_file"

    log "Health report generated: $report_file"
}

################################################################################
# Main Health Check Process
################################################################################

main() {
    log "Starting Atlas AI health check..."

    # Ensure required tools are available
    if ! command -v jq &> /dev/null; then
        error "jq is required but not installed"
        exit 1
    fi

    # Create state file directory
    mkdir -p "$(dirname "$STATE_FILE")"

    # Perform health checks
    local exit_code=0

    check_backend || exit_code=1
    check_frontend || exit_code=1
    check_mongodb || exit_code=1
    check_nginx || exit_code=1
    check_system_resources
    check_ssl_certificates
    check_database_integrity || exit_code=1

    # Generate health report
    generate_health_report

    if [[ $exit_code -eq 0 ]]; then
        log "Health check completed successfully"
    else
        warn "Health check completed with issues"
    fi

    return $exit_code
}

# Run main function
main "$@"