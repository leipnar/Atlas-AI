#!/bin/bash

################################################################################
# Atlas AI Support Assistant - Monitoring Script
#
# This script provides comprehensive monitoring and metrics collection for:
# - Application performance metrics
# - System resource utilization
# - Security events
# - Error tracking
# - Performance analytics
#
# Author: Atlas AI Team
# Version: 1.0.0
################################################################################

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
readonly CONFIG_DIR="${CONFIG_DIR:-/etc/atlas-ai}"
readonly LOG_DIR="${LOG_DIR:-/var/log/atlas-ai}"
readonly METRICS_DIR="$LOG_DIR/metrics"
readonly ALERTS_DIR="$LOG_DIR/alerts"

# Load configuration
if [[ -f "$CONFIG_DIR/monitor.conf" ]]; then
    source "$CONFIG_DIR/monitor.conf"
fi

# Default configuration
readonly COLLECTION_INTERVAL="${COLLECTION_INTERVAL:-60}"
readonly RETENTION_DAYS="${RETENTION_DAYS:-30}"
readonly ENABLE_PERFORMANCE_METRICS="${ENABLE_PERFORMANCE_METRICS:-true}"
readonly ENABLE_SECURITY_MONITORING="${ENABLE_SECURITY_MONITORING:-true}"
readonly ENABLE_ERROR_TRACKING="${ENABLE_ERROR_TRACKING:-true}"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

################################################################################
# Utility Functions
################################################################################

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

ensure_directories() {
    mkdir -p "$METRICS_DIR" "$ALERTS_DIR"
}

get_timestamp() {
    date +%s
}

################################################################################
# Performance Metrics Collection
################################################################################

collect_system_metrics() {
    if [[ "$ENABLE_PERFORMANCE_METRICS" != "true" ]]; then
        return 0
    fi

    local timestamp
    timestamp=$(get_timestamp)
    local metrics_file="$METRICS_DIR/system-$(date +%Y%m%d).json"

    # CPU metrics
    local cpu_usage
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')

    local cpu_load
    cpu_load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')

    # Memory metrics
    local memory_total memory_used memory_free memory_available
    read -r memory_total memory_used memory_free memory_available < <(
        free -b | awk 'NR==2{printf "%s %s %s %s", $2, $3, $4, $7}'
    )

    local memory_usage_percent
    memory_usage_percent=$(echo "scale=2; $memory_used * 100 / $memory_total" | bc)

    # Disk metrics
    local disk_usage disk_total disk_used disk_available
    read -r disk_total disk_used disk_available disk_usage < <(
        df -B1 / | awk 'NR==2{printf "%s %s %s %s", $2, $3, $4, $5}' | sed 's/%//'
    )

    # Network metrics
    local network_rx network_tx
    read -r network_rx network_tx < <(
        cat /proc/net/dev | grep -E "(eth0|ens|enp)" | head -1 | awk '{printf "%s %s", $2, $10}'
    )

    # Create metrics entry
    local metrics_entry
    metrics_entry=$(jq -n \
        --arg timestamp "$timestamp" \
        --arg cpu_usage "$cpu_usage" \
        --arg cpu_load "$cpu_load" \
        --arg memory_total "$memory_total" \
        --arg memory_used "$memory_used" \
        --arg memory_usage_percent "$memory_usage_percent" \
        --arg disk_total "$disk_total" \
        --arg disk_used "$disk_used" \
        --arg disk_usage "$disk_usage" \
        --arg network_rx "$network_rx" \
        --arg network_tx "$network_tx" \
        '{
            timestamp: ($timestamp | tonumber),
            cpu: {
                usage_percent: ($cpu_usage | tonumber),
                load_average: ($cpu_load | tonumber)
            },
            memory: {
                total_bytes: ($memory_total | tonumber),
                used_bytes: ($memory_used | tonumber),
                usage_percent: ($memory_usage_percent | tonumber)
            },
            disk: {
                total_bytes: ($disk_total | tonumber),
                used_bytes: ($disk_used | tonumber),
                usage_percent: ($disk_usage | tonumber)
            },
            network: {
                rx_bytes: ($network_rx | tonumber),
                tx_bytes: ($network_tx | tonumber)
            }
        }'
    )

    # Append to metrics file
    if [[ -f "$metrics_file" ]]; then
        jq --argjson entry "$metrics_entry" '. += [$entry]' "$metrics_file" > "$metrics_file.tmp"
        mv "$metrics_file.tmp" "$metrics_file"
    else
        echo "[$metrics_entry]" > "$metrics_file"
    fi
}

collect_application_metrics() {
    if [[ "$ENABLE_PERFORMANCE_METRICS" != "true" ]]; then
        return 0
    fi

    local timestamp
    timestamp=$(get_timestamp)
    local metrics_file="$METRICS_DIR/application-$(date +%Y%m%d).json"

    # Backend metrics
    local backend_status="down"
    local backend_response_time=0
    local backend_memory=0
    local backend_cpu=0

    if pgrep -f "atlas-backend" > /dev/null; then
        backend_status="up"

        # Get response time
        if backend_response_time=$(curl -w "%{time_total}" -s -o /dev/null --max-time 5 "http://localhost:${BACKEND_PORT:-3001}/health" 2>/dev/null); then
            backend_response_time=$(echo "$backend_response_time * 1000" | bc | cut -d. -f1)
        fi

        # Get process metrics
        local backend_pid
        backend_pid=$(pgrep -f "atlas-backend" | head -1)

        if [[ -n "$backend_pid" ]]; then
            local process_stats
            process_stats=$(ps -p "$backend_pid" -o %cpu,%mem --no-headers 2>/dev/null || echo "0 0")
            read -r backend_cpu backend_memory <<< "$process_stats"
        fi
    fi

    # Database metrics
    local db_status="down"
    local db_connections=0
    local db_operations=0

    if pgrep mongod > /dev/null; then
        db_status="up"

        # Get database stats (if credentials are available)
        if [[ -f "$CONFIG_DIR/secrets.txt" ]]; then
            local db_password
            db_password=$(grep "Database Password:" "$CONFIG_DIR/secrets.txt" | cut -d' ' -f3 2>/dev/null || echo "")

            if [[ -n "$db_password" ]]; then
                local db_stats
                if db_stats=$(mongosh --quiet --eval "JSON.stringify(db.serverStatus())" atlas_ai --username atlas_user --password "$db_password" 2>/dev/null); then
                    db_connections=$(echo "$db_stats" | jq -r '.connections.current // 0')
                    db_operations=$(echo "$db_stats" | jq -r '.opcounters.query + .opcounters.insert + .opcounters.update + .opcounters.delete')
                fi
            fi
        fi
    fi

    # Create application metrics entry
    local app_metrics
    app_metrics=$(jq -n \
        --arg timestamp "$timestamp" \
        --arg backend_status "$backend_status" \
        --arg backend_response_time "$backend_response_time" \
        --arg backend_cpu "$backend_cpu" \
        --arg backend_memory "$backend_memory" \
        --arg db_status "$db_status" \
        --arg db_connections "$db_connections" \
        --arg db_operations "$db_operations" \
        '{
            timestamp: ($timestamp | tonumber),
            backend: {
                status: $backend_status,
                response_time_ms: ($backend_response_time | tonumber),
                cpu_percent: ($backend_cpu | tonumber),
                memory_percent: ($backend_memory | tonumber)
            },
            database: {
                status: $db_status,
                connections: ($db_connections | tonumber),
                operations: ($db_operations | tonumber)
            }
        }'
    )

    # Append to metrics file
    if [[ -f "$metrics_file" ]]; then
        jq --argjson entry "$app_metrics" '. += [$entry]' "$metrics_file" > "$metrics_file.tmp"
        mv "$metrics_file.tmp" "$metrics_file"
    else
        echo "[$app_metrics]" > "$metrics_file"
    fi
}

################################################################################
# Security Monitoring
################################################################################

monitor_security_events() {
    if [[ "$ENABLE_SECURITY_MONITORING" != "true" ]]; then
        return 0
    fi

    local timestamp
    timestamp=$(get_timestamp)
    local security_log="$LOG_DIR/security-$(date +%Y%m%d).log"

    # Check for failed login attempts
    local failed_logins
    failed_logins=$(journalctl --since "1 minute ago" | grep -c "Failed password" || echo "0")

    if [[ $failed_logins -gt 0 ]]; then
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] Failed login attempts: $failed_logins" >> "$security_log"
    fi

    # Check for suspicious network activity
    local active_connections
    active_connections=$(netstat -tn | grep -c ":80\|:443\|:22" || echo "0")

    if [[ $active_connections -gt 100 ]]; then
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] High network activity: $active_connections connections" >> "$security_log"
    fi

    # Check for file system changes in critical directories
    local critical_dirs=("/etc/atlas-ai" "/opt/atlas-ai" "/etc/nginx/sites-available")
    for dir in "${critical_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            local recent_changes
            recent_changes=$(find "$dir" -type f -mmin -1 | wc -l)

            if [[ $recent_changes -gt 0 ]]; then
                echo "[$(date +'%Y-%m-%d %H:%M:%S')] File changes detected in $dir: $recent_changes files" >> "$security_log"
            fi
        fi
    done

    # Check fail2ban status
    if systemctl is-active fail2ban &>/dev/null; then
        local banned_ips
        banned_ips=$(fail2ban-client status | grep -o "Number of jail:.*" | grep -o "[0-9]*" || echo "0")

        if [[ $banned_ips -gt 0 ]]; then
            echo "[$(date +'%Y-%m-%d %H:%M:%S')] Fail2ban active jails: $banned_ips" >> "$security_log"
        fi
    fi
}

################################################################################
# Error Tracking
################################################################################

track_errors() {
    if [[ "$ENABLE_ERROR_TRACKING" != "true" ]]; then
        return 0
    fi

    local timestamp
    timestamp=$(get_timestamp)
    local error_log="$LOG_DIR/error-tracking-$(date +%Y%m%d).log"

    # Check backend error logs
    if [[ -f "$LOG_DIR/backend-error.log" ]]; then
        local backend_errors
        backend_errors=$(tail -n 100 "$LOG_DIR/backend-error.log" | grep -c "$(date +'%Y-%m-%d %H:%M')" || echo "0")

        if [[ $backend_errors -gt 0 ]]; then
            echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backend errors in last minute: $backend_errors" >> "$error_log"
        fi
    fi

    # Check Nginx error logs
    if [[ -f "/var/log/nginx/error.log" ]]; then
        local nginx_errors
        nginx_errors=$(tail -n 100 /var/log/nginx/error.log | grep -c "$(date +'%Y/%m/%d %H:%M')" || echo "0")

        if [[ $nginx_errors -gt 0 ]]; then
            echo "[$(date +'%Y-%m-%d %H:%M:%S')] Nginx errors in last minute: $nginx_errors" >> "$error_log"
        fi
    fi

    # Check MongoDB logs
    if [[ -f "/var/log/mongodb/mongod.log" ]]; then
        local mongo_errors
        mongo_errors=$(tail -n 100 /var/log/mongodb/mongod.log | grep -c "$(date +'%Y-%m-%dT%H:%M')" | grep -c "ERROR\|WARN" || echo "0")

        if [[ $mongo_errors -gt 0 ]]; then
            echo "[$(date +'%Y-%m-%d %H:%M:%S')] MongoDB errors/warnings in last minute: $mongo_errors" >> "$error_log"
        fi
    fi

    # Check system journal for critical errors
    local system_errors
    system_errors=$(journalctl --since "1 minute ago" --priority err | wc -l || echo "0")

    if [[ $system_errors -gt 0 ]]; then
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] System errors in last minute: $system_errors" >> "$error_log"
    fi
}

################################################################################
# Performance Analysis
################################################################################

analyze_performance_trends() {
    local metrics_file="$METRICS_DIR/system-$(date +%Y%m%d).json"

    if [[ ! -f "$metrics_file" ]]; then
        return 0
    fi

    local analysis_file="$METRICS_DIR/analysis-$(date +%Y%m%d).json"

    # Calculate averages for the day
    local avg_cpu avg_memory avg_disk
    avg_cpu=$(jq '[.[].cpu.usage_percent] | add / length' "$metrics_file" 2>/dev/null || echo "0")
    avg_memory=$(jq '[.[].memory.usage_percent] | add / length' "$metrics_file" 2>/dev/null || echo "0")
    avg_disk=$(jq '[.[].disk.usage_percent] | add / length' "$metrics_file" 2>/dev/null || echo "0")

    # Calculate peak values
    local peak_cpu peak_memory
    peak_cpu=$(jq '[.[].cpu.usage_percent] | max' "$metrics_file" 2>/dev/null || echo "0")
    peak_memory=$(jq '[.[].memory.usage_percent] | max' "$metrics_file" 2>/dev/null || echo "0")

    # Create analysis report
    local analysis
    analysis=$(jq -n \
        --arg timestamp "$(get_timestamp)" \
        --arg avg_cpu "$avg_cpu" \
        --arg avg_memory "$avg_memory" \
        --arg avg_disk "$avg_disk" \
        --arg peak_cpu "$peak_cpu" \
        --arg peak_memory "$peak_memory" \
        '{
            date: (now | strftime("%Y-%m-%d")),
            timestamp: ($timestamp | tonumber),
            averages: {
                cpu_percent: ($avg_cpu | tonumber),
                memory_percent: ($avg_memory | tonumber),
                disk_percent: ($avg_disk | tonumber)
            },
            peaks: {
                cpu_percent: ($peak_cpu | tonumber),
                memory_percent: ($peak_memory | tonumber)
            }
        }'
    )

    echo "$analysis" > "$analysis_file"
}

################################################################################
# Cleanup Functions
################################################################################

cleanup_old_metrics() {
    log "Cleaning up old metrics (older than $RETENTION_DAYS days)..."

    # Remove old metrics files
    find "$METRICS_DIR" -name "*.json" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    find "$LOG_DIR" -name "*-$(date -d "-$RETENTION_DAYS days" +%Y%m%d).log" -type f -delete 2>/dev/null || true

    log "Old metrics cleaned up"
}

################################################################################
# Reporting Functions
################################################################################

generate_daily_report() {
    local report_date
    report_date=$(date +%Y%m%d)
    local report_file="$LOG_DIR/daily-report-$report_date.txt"

    {
        echo "==============================================="
        echo "Atlas AI Daily Monitoring Report"
        echo "Date: $(date +'%Y-%m-%d')"
        echo "==============================================="
        echo ""

        # System metrics summary
        if [[ -f "$METRICS_DIR/analysis-$report_date.json" ]]; then
            echo "SYSTEM PERFORMANCE SUMMARY"
            echo "-------------------------"
            jq -r '"Average CPU Usage: " + (.averages.cpu_percent | tostring) + "%"' "$METRICS_DIR/analysis-$report_date.json"
            jq -r '"Average Memory Usage: " + (.averages.memory_percent | tostring) + "%"' "$METRICS_DIR/analysis-$report_date.json"
            jq -r '"Average Disk Usage: " + (.averages.disk_percent | tostring) + "%"' "$METRICS_DIR/analysis-$report_date.json"
            jq -r '"Peak CPU Usage: " + (.peaks.cpu_percent | tostring) + "%"' "$METRICS_DIR/analysis-$report_date.json"
            jq -r '"Peak Memory Usage: " + (.peaks.memory_percent | tostring) + "%"' "$METRICS_DIR/analysis-$report_date.json"
            echo ""
        fi

        # Security events summary
        if [[ -f "$LOG_DIR/security-$report_date.log" ]]; then
            echo "SECURITY EVENTS SUMMARY"
            echo "----------------------"
            local security_events
            security_events=$(wc -l < "$LOG_DIR/security-$report_date.log")
            echo "Total security events: $security_events"

            if [[ $security_events -gt 0 ]]; then
                echo "Latest events:"
                tail -5 "$LOG_DIR/security-$report_date.log"
            fi
            echo ""
        fi

        # Error tracking summary
        if [[ -f "$LOG_DIR/error-tracking-$report_date.log" ]]; then
            echo "ERROR TRACKING SUMMARY"
            echo "---------------------"
            local error_events
            error_events=$(wc -l < "$LOG_DIR/error-tracking-$report_date.log")
            echo "Total error events: $error_events"

            if [[ $error_events -gt 0 ]]; then
                echo "Latest errors:"
                tail -5 "$LOG_DIR/error-tracking-$report_date.log"
            fi
            echo ""
        fi

        echo "Report generated: $(date +'%Y-%m-%d %H:%M:%S')"
        echo "==============================================="
    } > "$report_file"

    log "Daily report generated: $report_file"
}

################################################################################
# Main Monitoring Function
################################################################################

run_monitoring_cycle() {
    log "Starting monitoring cycle..."

    # Collect metrics
    collect_system_metrics
    collect_application_metrics

    # Monitor security
    monitor_security_events

    # Track errors
    track_errors

    log "Monitoring cycle completed"
}

show_status() {
    info "Atlas AI Monitoring Status"
    echo "=========================="
    echo ""

    # Show current system status
    echo "System Status:"
    echo "-------------"
    local cpu_usage
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    local memory_usage
    memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    local disk_usage
    disk_usage=$(df -h / | awk 'NR==2 {print $5}')

    echo "CPU Usage: ${cpu_usage}%"
    echo "Memory Usage: ${memory_usage}%"
    echo "Disk Usage: ${disk_usage}"
    echo ""

    # Show service status
    echo "Service Status:"
    echo "--------------"
    local services=("atlas-ai" "nginx" "mongod")
    for service in "${services[@]}"; do
        if systemctl is-active "$service" &>/dev/null; then
            echo "$service: RUNNING"
        else
            echo "$service: STOPPED"
        fi
    done
    echo ""

    # Show metrics collection status
    echo "Metrics Collection:"
    echo "------------------"
    local today
    today=$(date +%Y%m%d)

    if [[ -f "$METRICS_DIR/system-$today.json" ]]; then
        local entries
        entries=$(jq length "$METRICS_DIR/system-$today.json" 2>/dev/null || echo "0")
        echo "System metrics today: $entries entries"
    else
        echo "System metrics today: 0 entries"
    fi

    if [[ -f "$METRICS_DIR/application-$today.json" ]]; then
        local entries
        entries=$(jq length "$METRICS_DIR/application-$today.json" 2>/dev/null || echo "0")
        echo "Application metrics today: $entries entries"
    else
        echo "Application metrics today: 0 entries"
    fi
    echo ""
}

################################################################################
# Main Function
################################################################################

main() {
    local command="${1:-monitor}"

    ensure_directories

    case "$command" in
        "monitor")
            run_monitoring_cycle
            ;;
        "analyze")
            analyze_performance_trends
            ;;
        "report")
            generate_daily_report
            ;;
        "cleanup")
            cleanup_old_metrics
            ;;
        "status")
            show_status
            ;;
        "daemon")
            log "Starting monitoring daemon..."
            while true; do
                run_monitoring_cycle
                sleep "$COLLECTION_INTERVAL"
            done
            ;;
        *)
            echo "Usage: $0 {monitor|analyze|report|cleanup|status|daemon}"
            echo ""
            echo "Commands:"
            echo "  monitor  - Run single monitoring cycle"
            echo "  analyze  - Analyze performance trends"
            echo "  report   - Generate daily report"
            echo "  cleanup  - Clean up old metrics"
            echo "  status   - Show current status"
            echo "  daemon   - Run continuous monitoring"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"