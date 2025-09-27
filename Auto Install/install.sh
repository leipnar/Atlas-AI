#!/bin/bash

################################################################################
# Atlas AI Support Assistant - Auto Installation Script
#
# This script provides complete automated deployment for:
# - Backend: Node.js/TypeScript with Express.js
# - Frontend: React/Vue/Angular application
# - Database: MongoDB
# - Web Server: Nginx reverse proxy
# - Process Manager: PM2
# - SSL: Let's Encrypt automatic certificates
# - Monitoring: Basic health checks and logging
#
# Usage:
# Interactive setup (recommended):
# curl -sSL https://raw.githubusercontent.com/leipnar/Atlas-AI/main/Auto%20Install/install.sh | bash
#
# With command line parameters:
# curl -sSL https://raw.githubusercontent.com/leipnar/Atlas-AI/main/Auto%20Install/install.sh | bash -s -- --domain=yourdomain.com --email=your@email.com
#
# Author: Atlas AI Team
# Version: 1.0.0
################################################################################

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Default configuration
readonly SCRIPT_VERSION="1.0.0"
readonly APP_NAME="atlas-ai"
readonly REPO_URL="https://github.com/leipnar/Atlas-AI.git"
readonly INSTALL_DIR="/opt/atlas-ai"
readonly LOG_DIR="/var/log/atlas-ai"
readonly BACKUP_DIR="/var/backups/atlas-ai"
readonly CONFIG_DIR="/etc/atlas-ai"

# Default values
DOMAIN=""
EMAIL=""
DB_PASSWORD=""
SESSION_SECRET=""
GEMINI_API_KEY=""
ENVIRONMENT="production"
FRONTEND_PORT="3000"
BACKEND_PORT="3001"
NGINX_PORT="80"
NGINX_SSL_PORT="443"
SKIP_SSL="false"
FORCE_INSTALL="false"
REPO_BRANCH="main"

# System info
OS_TYPE=""
OS_VERSION=""
PACKAGE_MANAGER=""

# Installation state
INSTALL_LOG="${LOG_DIR}/install.log"
ERROR_LOG="${LOG_DIR}/error.log"
ROLLBACK_COMMANDS=()

################################################################################
# Utility Functions
################################################################################

log() {
    # Ensure log directory exists before logging
    if [[ ! -d "$LOG_DIR" ]]; then
        sudo mkdir -p "$LOG_DIR" 2>/dev/null || {
            echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
            return
        }
    fi
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$INSTALL_LOG"
}

warn() {
    # Ensure log directory exists before logging
    if [[ ! -d "$LOG_DIR" ]]; then
        sudo mkdir -p "$LOG_DIR" 2>/dev/null || {
            echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
            return
        }
    fi
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$INSTALL_LOG"
}

error() {
    # Ensure log directory exists before logging
    if [[ ! -d "$LOG_DIR" ]]; then
        sudo mkdir -p "$LOG_DIR" 2>/dev/null || {
            echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
            return
        }
    fi
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$ERROR_LOG"
}

fatal() {
    error "$1"
    echo -e "${RED}Installation failed. Check logs at $ERROR_LOG${NC}"
    exit 1
}

add_rollback() {
    ROLLBACK_COMMANDS+=("$1")
}

execute_rollback() {
    warn "Executing rollback procedures..."

    if [[ ${#ROLLBACK_COMMANDS[@]} -eq 0 ]]; then
        warn "No rollback commands to execute"
        return
    fi

    for ((i=${#ROLLBACK_COMMANDS[@]}-1; i>=0; i--)); do
        warn "Executing rollback command: ${ROLLBACK_COMMANDS[i]}"
        if ! eval "${ROLLBACK_COMMANDS[i]}" 2>>"$ERROR_LOG"; then
            error "Rollback command failed: ${ROLLBACK_COMMANDS[i]}"
        fi
    done

    warn "Rollback completed"
}

# Trap function for cleanup on exit
cleanup_on_exit() {
    local exit_code=$?

    if [[ $exit_code -ne 0 ]]; then
        error "Installation failed with exit code $exit_code"
        execute_rollback

        # Save installation state for debugging
        cat > "/tmp/atlas-install-debug.log" << EOF
Installation failed at: $(date)
Exit code: $exit_code
OS: $OS_TYPE $OS_VERSION
Domain: $DOMAIN
Email: $EMAIL
Environment: $ENVIRONMENT

Last 20 lines of install log:
$(tail -20 "$INSTALL_LOG" 2>/dev/null || echo "No install log available")

Last 20 lines of error log:
$(tail -20 "$ERROR_LOG" 2>/dev/null || echo "No error log available")

System information:
$(uname -a)
$(free -h)
$(df -h)
EOF

        echo
        error "Installation failed. Debug information saved to /tmp/atlas-install-debug.log"
        echo -e "${YELLOW}Please check the logs and try again, or contact support with the debug file.${NC}"
        echo -e "${BLUE}Common solutions:${NC}"
        echo "  1. Ensure you have sufficient disk space (10GB+ free)"
        echo "  2. Check internet connectivity"
        echo "  3. Verify domain DNS is pointing to this server"
        echo "  4. Run with --force to retry after fixing issues"
    fi
}

# Set up signal traps
trap cleanup_on_exit EXIT
trap 'exit 130' INT  # Ctrl+C
trap 'exit 143' TERM # Termination

check_root() {
    if [[ $EUID -ne 0 ]]; then
        fatal "This script must be run as root. Use sudo or run as root user."
    fi
}

check_internet() {
    local test_urls=("google.com" "8.8.8.8" "cloudflare.com")
    local connected=false

    log "Checking internet connectivity..."

    for url in "${test_urls[@]}"; do
        if ping -c 1 -W 5 "$url" &> /dev/null; then
            connected=true
            break
        fi
    done

    if ! $connected; then
        fatal "No internet connection available. Please check your network connection and try again."
    fi

    log "Internet connectivity confirmed"
}

prompt_user_input() {
    echo
    echo -e "${BLUE}==================================================${NC}"
    echo -e "${GREEN}   Welcome to Atlas AI Support Assistant Setup   ${NC}"
    echo -e "${BLUE}==================================================${NC}"
    echo
    echo "This installer will set up a complete Atlas AI environment with:"
    echo "• Node.js backend with MongoDB database"
    echo "• React frontend application"
    echo "• Nginx reverse proxy with SSL certificates"
    echo "• PM2 process management and monitoring"
    echo "• Automated backups and security hardening"
    echo

    # Prompt for domain if not provided via command line
    if [[ -z "$DOMAIN" ]]; then
        echo -e "${YELLOW}Please enter your domain information:${NC}"
        while [[ -z "$DOMAIN" ]]; do
            echo -n "Domain name (e.g., atlas.example.com): "
            read -r DOMAIN
            if [[ -z "$DOMAIN" ]]; then
                echo -e "${RED}Domain is required. Please enter a valid domain name.${NC}"
            elif [[ ! "$DOMAIN" =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$ ]]; then
                echo -e "${RED}Please enter a valid domain name (e.g., atlas.example.com)${NC}"
                DOMAIN=""
            fi
        done
    fi

    # Prompt for email if not provided via command line
    if [[ -z "$EMAIL" ]]; then
        echo -n "Email address (for SSL certificates): "
        while [[ -z "$EMAIL" ]]; do
            read -r EMAIL
            if [[ -z "$EMAIL" ]]; then
                echo -e "${RED}Email is required. Please enter a valid email address.${NC}"
                echo -n "Email address (for SSL certificates): "
            elif [[ ! "$EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
                echo -e "${RED}Please enter a valid email address.${NC}"
                echo -n "Email address (for SSL certificates): "
                EMAIL=""
            fi
        done
    fi

    echo
    echo -e "${GREEN}Configuration Summary:${NC}"
    echo "• Domain: $DOMAIN"
    echo "• Email: $EMAIL"
    echo "• Environment: $ENVIRONMENT"
    echo

    # Confirmation prompt
    echo -e "${YELLOW}Do you want to proceed with the installation? (y/N):${NC}"
    read -r -n 1 confirmation
    echo

    if [[ ! "$confirmation" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Installation cancelled by user.${NC}"
        exit 0
    fi

    echo -e "${GREEN}Starting installation...${NC}"
    echo
}

generate_password() {
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -base64 32 | tr -d '=/+' | cut -c1-25
    elif command -v python3 >/dev/null 2>&1; then
        python3 -c "import secrets, string; print(''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(25)))"
    elif [[ -f /dev/urandom ]]; then
        tr -dc 'A-Za-z0-9' </dev/urandom | head -c 25
    else
        # Fallback to date-based generation (less secure)
        echo "$(date +%s)$(hostname)" | sha256sum | head -c 25
    fi
}

detect_os() {
    log "Detecting operating system..."

    if [[ -f /etc/os-release ]]; then
        source /etc/os-release
        OS_TYPE="$ID"
        OS_VERSION="$VERSION_ID"
    elif [[ -f /etc/redhat-release ]]; then
        OS_TYPE="centos"
        OS_VERSION=$(cat /etc/redhat-release | grep -o '[0-9]\+' | head -1)
    elif [[ -f /etc/debian_version ]]; then
        OS_TYPE="debian"
        OS_VERSION=$(cat /etc/debian_version)
    else
        fatal "Cannot detect operating system. Supported systems: Ubuntu, Debian, CentOS, RHEL, Fedora, Rocky Linux, AlmaLinux"
    fi

    case "$OS_TYPE" in
        ubuntu)
            PACKAGE_MANAGER="apt"
            if [[ $(echo "$OS_VERSION >= 18.04" | bc -l) -eq 0 ]]; then
                fatal "Ubuntu 18.04 or higher is required. Found: $OS_VERSION"
            fi
            ;;
        debian)
            PACKAGE_MANAGER="apt"
            if [[ "${OS_VERSION%%.*}" -lt 9 ]]; then
                fatal "Debian 9 or higher is required. Found: $OS_VERSION"
            fi
            ;;
        centos|rhel)
            if [[ "${OS_VERSION%%.*}" -lt 7 ]]; then
                fatal "CentOS/RHEL 7 or higher is required. Found: $OS_VERSION"
            fi
            if [[ "${OS_VERSION%%.*}" -ge 8 ]]; then
                PACKAGE_MANAGER="dnf"
            else
                PACKAGE_MANAGER="yum"
            fi
            ;;
        fedora)
            PACKAGE_MANAGER="dnf"
            if [[ "${OS_VERSION%%.*}" -lt 35 ]]; then
                warn "Fedora 35 or higher is recommended. Found: $OS_VERSION"
            fi
            ;;
        rocky|almalinux)
            PACKAGE_MANAGER="dnf"
            if [[ "${OS_VERSION%%.*}" -lt 8 ]]; then
                fatal "Rocky Linux/AlmaLinux 8 or higher is required. Found: $OS_VERSION"
            fi
            ;;
        *)
            fatal "Unsupported operating system: $OS_TYPE. Supported: Ubuntu 18.04+, Debian 9+, CentOS 7+, RHEL 7+, Fedora 35+, Rocky Linux 8+, AlmaLinux 8+"
            ;;
    esac

    log "Detected OS: $OS_TYPE $OS_VERSION (Package manager: $PACKAGE_MANAGER)"
}

# Check system requirements
check_system_requirements() {
    log "Checking system requirements..."

    # Check available memory (minimum 1GB, recommended 2GB)
    local mem_total=$(free -m | awk 'NR==2{print $2}')
    if [[ $mem_total -lt 1024 ]]; then
        fatal "Insufficient memory. Minimum 1GB required, found: ${mem_total}MB"
    elif [[ $mem_total -lt 2048 ]]; then
        warn "Low memory detected (${mem_total}MB). 2GB or more is recommended for optimal performance"
    fi

    # Check available disk space (minimum 5GB, recommended 10GB)
    local disk_avail=$(df / | awk 'NR==2{print $4}')
    local disk_avail_gb=$((disk_avail / 1024 / 1024))
    if [[ $disk_avail_gb -lt 5 ]]; then
        fatal "Insufficient disk space. Minimum 5GB required, found: ${disk_avail_gb}GB"
    elif [[ $disk_avail_gb -lt 10 ]]; then
        warn "Low disk space detected (${disk_avail_gb}GB). 10GB or more is recommended"
    fi

    # Check if ports are available
    local ports_to_check=("80" "443" "$BACKEND_PORT")
    for port in "${ports_to_check[@]}"; do
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            if [[ "$FORCE_INSTALL" != "true" ]]; then
                fatal "Port $port is already in use. Use --force to override or stop the service using this port"
            else
                warn "Port $port is in use but continuing due to --force flag"
            fi
        fi
    done

    log "System requirements check passed"
}

# Validate input parameters
validate_parameters() {
    log "Validating input parameters..."

    # Validate domain
    if [[ -z "$DOMAIN" ]]; then
        fatal "Domain is required. Use --domain=yourdomain.com"
    fi

    # Basic domain validation
    if [[ ! "$DOMAIN" =~ ^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$ ]]; then
        fatal "Invalid domain format: $DOMAIN"
    fi

    # Validate email
    if [[ -z "$EMAIL" ]]; then
        fatal "Email is required. Use --email=your@email.com"
    fi

    # Basic email validation
    if [[ ! "$EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        fatal "Invalid email format: $EMAIL"
    fi

    # Validate environment
    if [[ ! "$ENVIRONMENT" =~ ^(production|staging|development)$ ]]; then
        fatal "Invalid environment: $ENVIRONMENT. Must be production, staging, or development"
    fi

    # Validate ports
    if [[ ! "$FRONTEND_PORT" =~ ^[0-9]+$ ]] || [[ "$FRONTEND_PORT" -lt 1024 ]] || [[ "$FRONTEND_PORT" -gt 65535 ]]; then
        fatal "Invalid frontend port: $FRONTEND_PORT. Must be between 1024 and 65535"
    fi

    if [[ ! "$BACKEND_PORT" =~ ^[0-9]+$ ]] || [[ "$BACKEND_PORT" -lt 1024 ]] || [[ "$BACKEND_PORT" -gt 65535 ]]; then
        fatal "Invalid backend port: $BACKEND_PORT. Must be between 1024 and 65535"
    fi

    # Generate passwords if not provided
    if [[ -z "$DB_PASSWORD" ]]; then
        DB_PASSWORD=$(generate_password)
        log "Generated database password"
    fi

    if [[ -z "$SESSION_SECRET" ]]; then
        SESSION_SECRET=$(generate_password)
        log "Generated session secret"
    fi

    log "Parameter validation completed"
}

################################################################################
# Argument Parsing
################################################################################

show_help() {
    cat << EOF
Atlas AI Support Assistant - Auto Installation Script v$SCRIPT_VERSION

Usage: $0 [OPTIONS]

Interactive Setup:
  If domain and email are not provided via command line, you will be prompted to enter them interactively.

Optional Options:
  --domain=DOMAIN          Domain name for the application (prompted if not provided)
  --email=EMAIL           Email address for SSL certificates (prompted if not provided)
  --db-password=PASSWORD   MongoDB password (auto-generated if not provided)
  --session-secret=SECRET  Session secret (auto-generated if not provided)
  --gemini-api-key=KEY    Google Gemini API key
  --environment=ENV       Environment type (production|staging|development)
  --frontend-port=PORT    Frontend port (default: 3000)
  --backend-port=PORT     Backend port (default: 3001)
  --skip-ssl              Skip SSL certificate setup
  --force                 Force installation even if already installed
  --repo-branch=BRANCH    Git branch to clone (default: main)
  --help                  Show this help message

Examples:
  # Interactive setup (recommended):
  $0

  # With command line parameters:
  $0 --domain=atlas.example.com --email=admin@example.com
  $0 --domain=atlas.example.com --email=admin@example.com --environment=staging --skip-ssl

EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --domain=*)
                DOMAIN="${1#*=}"
                shift
                ;;
            --email=*)
                EMAIL="${1#*=}"
                shift
                ;;
            --db-password=*)
                DB_PASSWORD="${1#*=}"
                shift
                ;;
            --session-secret=*)
                SESSION_SECRET="${1#*=}"
                shift
                ;;
            --gemini-api-key=*)
                GEMINI_API_KEY="${1#*=}"
                shift
                ;;
            --environment=*)
                ENVIRONMENT="${1#*=}"
                shift
                ;;
            --frontend-port=*)
                FRONTEND_PORT="${1#*=}"
                shift
                ;;
            --backend-port=*)
                BACKEND_PORT="${1#*=}"
                shift
                ;;
            --skip-ssl)
                SKIP_SSL="true"
                shift
                ;;
            --force)
                FORCE_INSTALL="true"
                shift
                ;;
            --repo-branch=*)
                REPO_BRANCH="${1#*=}"
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                warn "Unknown option: $1"
                shift
                ;;
        esac
    done

    # Note: Domain and email validation moved to prompt_user_input function
    # They can be provided via command line or prompted interactively

    # Generate passwords if not provided
    if [[ -z "$DB_PASSWORD" ]]; then
        DB_PASSWORD=$(generate_password)
        log "Generated database password"
    fi

    if [[ -z "$SESSION_SECRET" ]]; then
        SESSION_SECRET=$(generate_password)
        log "Generated session secret"
    fi

    # Validate environment
    case "$ENVIRONMENT" in
        production|staging|development)
            ;;
        *)
            fatal "Invalid environment: $ENVIRONMENT. Must be production, staging, or development"
            ;;
    esac
}

################################################################################
# System Setup
################################################################################

setup_directories() {
    log "Setting up directories..."

    # Create directories with proper error handling
    sudo mkdir -p "$INSTALL_DIR" "$LOG_DIR" "$BACKUP_DIR" "$CONFIG_DIR" || fatal "Failed to create system directories"
    sudo mkdir -p /var/www/atlas-ai || fatal "Failed to create web directory"

    # Set proper permissions
    sudo chown -R www-data:www-data /var/www/atlas-ai || warn "Failed to set web directory ownership"
    sudo chmod -R 755 /var/www/atlas-ai || warn "Failed to set web directory permissions"

    # Set permissions for log directory
    sudo chown -R root:adm "$LOG_DIR" || warn "Failed to set log directory ownership"
    sudo chmod -R 755 "$LOG_DIR" || warn "Failed to set log directory permissions"

    add_rollback "rm -rf $INSTALL_DIR $LOG_DIR $BACKUP_DIR $CONFIG_DIR /var/www/atlas-ai"
}

update_system() {
    log "Updating system packages..."

    case "$PACKAGE_MANAGER" in
        apt)
            apt-get update
            apt-get upgrade -y
            ;;
        yum)
            yum update -y
            ;;
        dnf)
            dnf update -y
            ;;
    esac
}

install_dependencies() {
    log "Installing system dependencies..."

    case "$PACKAGE_MANAGER" in
        apt)
            apt-get install -y curl wget git nginx certbot python3-certbot-nginx \
                             ufw fail2ban htop unzip software-properties-common \
                             build-essential openssl
            ;;
        yum)
            # Enable EPEL repository for additional packages
            yum install -y epel-release
            yum install -y curl wget git nginx certbot python3-certbot-nginx \
                          firewalld fail2ban htop unzip openssl-devel gcc-c++ make \
                          policycoreutils-python-utils
            ;;
        dnf)
            # Enable EPEL repository for additional packages
            dnf install -y epel-release
            dnf install -y curl wget git nginx certbot python3-certbot-nginx \
                          firewalld fail2ban htop unzip openssl-devel gcc-c++ make \
                          policycoreutils-python-utils
            ;;
    esac
}

install_nodejs() {
    log "Installing Node.js..."

    case "$PACKAGE_MANAGER" in
        apt)
            # Install Node.js 18.x LTS for Debian/Ubuntu
            curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
            apt-get install -y nodejs
            ;;
        yum)
            # Install Node.js 18.x LTS for CentOS/RHEL 7
            curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
            yum install -y nodejs npm
            ;;
        dnf)
            # Install Node.js 18.x LTS for Fedora/RHEL 8+/Rocky/Alma
            curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
            dnf install -y nodejs npm
            ;;
    esac

    # Install PM2 globally
    npm install -g pm2

    # Verify installation
    node_version=$(node --version)
    npm_version=$(npm --version)
    pm2_version=$(pm2 --version)

    log "Installed Node.js $node_version, npm $npm_version, PM2 $pm2_version"
}

install_mongodb() {
    log "Installing MongoDB..."

    case "$OS_TYPE" in
        ubuntu|debian)
            # Import MongoDB public GPG key
            wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -

            # Add MongoDB repository
            echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-6.0.list

            apt-get update
            apt-get install -y mongodb-org
            ;;
        centos|rhel|fedora|rocky|almalinux)
            # Add MongoDB repository
            cat > /etc/yum.repos.d/mongodb-org-6.0.repo << EOF
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/\$releasever/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
EOF

            case "$PACKAGE_MANAGER" in
                yum)
                    yum install -y mongodb-org
                    ;;
                dnf)
                    dnf install -y mongodb-org
                    ;;
            esac
            ;;
    esac

    # Enable and start MongoDB
    systemctl enable mongod
    systemctl start mongod

    add_rollback "systemctl stop mongod && systemctl disable mongod"

    log "MongoDB installed and started"
}

configure_mongodb() {
    log "Configuring MongoDB security..."

    # Wait for MongoDB to start
    sleep 5

    # Create admin user
    mongosh --eval "
        use admin;
        db.createUser({
            user: 'admin',
            pwd: '$DB_PASSWORD',
            roles: ['userAdminAnyDatabase', 'dbAdminAnyDatabase', 'readWriteAnyDatabase']
        });

        use atlas_ai;
        db.createUser({
            user: 'atlas_user',
            pwd: '$DB_PASSWORD',
            roles: ['readWrite']
        });
    "

    # Enable authentication
    sed -i 's/#security:/security:\n  authorization: enabled/' /etc/mongod.conf

    # Restart MongoDB with authentication
    systemctl restart mongod

    log "MongoDB security configured"
}

################################################################################
# Application Deployment
################################################################################

clone_repository() {
    log "Cloning application repository..."

    cd "$INSTALL_DIR"
    git clone -b "$REPO_BRANCH" "$REPO_URL" .

    add_rollback "rm -rf $INSTALL_DIR/*"

    log "Repository cloned successfully"
}

setup_backend() {
    log "Setting up backend application..."

    cd "$INSTALL_DIR/Back"

    # Install dependencies
    npm ci --production

    # Create environment file
    cat > .env << EOF
# Server Configuration
PORT=$BACKEND_PORT
FRONTEND_URL=https://$DOMAIN

# Database Connection
DATABASE_URL=mongodb://atlas_user:$DB_PASSWORD@localhost:27017/atlas_ai

# Authentication
SESSION_SECRET=$SESSION_SECRET

# Google Gemini API Key
GEMINI_API_KEY=$GEMINI_API_KEY

# Environment
NODE_ENV=$ENVIRONMENT

# Logging
LOG_LEVEL=info

# Security
TRUST_PROXY=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5
EOF

    # Build the application
    npm run build

    log "Backend setup completed"
}

setup_frontend() {
    log "Setting up frontend application..."

    cd "$INSTALL_DIR/Front"

    # Install dependencies
    npm ci --production

    # Build the application
    npm run build

    # Copy build files to web directory
    cp -r dist/* /var/www/atlas-ai/ || cp -r build/* /var/www/atlas-ai/

    # Set proper permissions
    chown -R www-data:www-data /var/www/atlas-ai
    chmod -R 755 /var/www/atlas-ai

    log "Frontend setup completed"
}

setup_pm2() {
    log "Setting up PM2 process manager..."

    # Create PM2 ecosystem file
    cat > "$INSTALL_DIR/Back/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: 'atlas-backend',
    script: './dist/server.js',
    cwd: '$INSTALL_DIR/Back',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: '$ENVIRONMENT',
      PORT: $BACKEND_PORT
    },
    error_file: '$LOG_DIR/backend-error.log',
    out_file: '$LOG_DIR/backend-out.log',
    log_file: '$LOG_DIR/backend-combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    autorestart: true,
    max_restarts: 5,
    min_uptime: '10s'
  }]
};
EOF

    # Create atlas user for running the application
    useradd -r -s /bin/false atlas || true
    chown -R atlas:atlas "$INSTALL_DIR" "$LOG_DIR"

    # Start application with PM2
    cd "$INSTALL_DIR/Back"
    sudo -u atlas pm2 start ecosystem.config.js

    # Save PM2 configuration
    sudo -u atlas pm2 save

    # Setup PM2 startup script
    sudo -u atlas pm2 startup systemd -u atlas --hp /home/atlas

    add_rollback "pm2 delete atlas-backend && pm2 kill"

    log "PM2 setup completed"
}

################################################################################
# Web Server Configuration
################################################################################

configure_nginx() {
    log "Configuring Nginx..."

    # Backup default configuration
    cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

    # Create application configuration
    cat > "/etc/nginx/sites-available/$APP_NAME" << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

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
        try_files \$uri \$uri/ /index.html;
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    location /api/ {
        limit_req zone=api burst=20 nodelay;
    }
}
EOF

    # Enable the site
    ln -sf "/etc/nginx/sites-available/$APP_NAME" "/etc/nginx/sites-enabled/"

    # Remove default site
    rm -f /etc/nginx/sites-enabled/default

    # Test configuration
    nginx -t || fatal "Nginx configuration test failed"

    # Enable and start Nginx
    systemctl enable nginx
    systemctl reload nginx

    add_rollback "rm -f /etc/nginx/sites-enabled/$APP_NAME && systemctl reload nginx"

    log "Nginx configured successfully"
}

setup_ssl() {
    if [[ "$SKIP_SSL" == "true" ]]; then
        warn "Skipping SSL setup as requested"
        return 0
    fi

    log "Setting up SSL certificates..."

    # Get SSL certificate
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive --redirect

    # Test automatic renewal
    certbot renew --dry-run

    # Setup automatic renewal cron job
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

    log "SSL certificates configured successfully"
}

################################################################################
# Security Configuration
################################################################################

configure_firewall() {
    log "Configuring firewall..."

    case "$OS_TYPE" in
        ubuntu|debian)
            # Configure UFW
            ufw --force reset
            ufw default deny incoming
            ufw default allow outgoing

            # Allow SSH (assuming standard port)
            ufw allow 22/tcp

            # Allow HTTP and HTTPS
            ufw allow 80/tcp
            ufw allow 443/tcp

            # Allow MongoDB only from localhost
            ufw allow from 127.0.0.1 to any port 27017

            ufw --force enable
            ;;
        centos|rhel|fedora|rocky|almalinux)
            # Configure firewalld
            systemctl enable firewalld
            systemctl start firewalld

            firewall-cmd --permanent --add-service=ssh
            firewall-cmd --permanent --add-service=http
            firewall-cmd --permanent --add-service=https

            # Allow MongoDB only from localhost (port 27017)
            firewall-cmd --permanent --add-rich-rule="rule family=ipv4 source address=127.0.0.1 port protocol=tcp port=27017 accept"

            firewall-cmd --reload
            ;;
    esac

    log "Firewall configured successfully"
}

configure_fail2ban() {
    log "Configuring Fail2Ban..."

    # Create jail configuration
    cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log
backend = systemd

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 6

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

    # Create custom nginx filters
    cat > /etc/fail2ban/filter.d/nginx-limit-req.conf << EOF
[Definition]
failregex = limiting requests, excess: .* by zone .*, client: <HOST>
ignoreregex =
EOF

    # Enable and start fail2ban
    systemctl enable fail2ban
    systemctl restart fail2ban

    log "Fail2Ban configured successfully"
}

################################################################################
# Monitoring and Backup
################################################################################

setup_monitoring() {
    log "Setting up monitoring..."

    # Create health check script
    cat > "$CONFIG_DIR/health-check.sh" << 'EOF'
#!/bin/bash

BACKEND_URL="http://localhost:${BACKEND_PORT}/health"
FRONTEND_URL="https://${DOMAIN}"
LOG_FILE="/var/log/atlas-ai/health-check.log"

# Check backend
if curl -f -s "$BACKEND_URL" > /dev/null; then
    echo "$(date): Backend OK" >> "$LOG_FILE"
else
    echo "$(date): Backend FAILED" >> "$LOG_FILE"
    # Restart backend if needed
    pm2 restart atlas-backend
fi

# Check frontend
if curl -f -s "$FRONTEND_URL" > /dev/null; then
    echo "$(date): Frontend OK" >> "$LOG_FILE"
else
    echo "$(date): Frontend FAILED" >> "$LOG_FILE"
    # Restart nginx if needed
    systemctl restart nginx
fi

# Check MongoDB
if mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "$(date): MongoDB OK" >> "$LOG_FILE"
else
    echo "$(date): MongoDB FAILED" >> "$LOG_FILE"
    systemctl restart mongod
fi
EOF

    chmod +x "$CONFIG_DIR/health-check.sh"

    # Add to crontab (every 5 minutes)
    (crontab -l 2>/dev/null; echo "*/5 * * * * $CONFIG_DIR/health-check.sh") | crontab -

    log "Monitoring setup completed"
}

setup_backup() {
    log "Setting up backup system..."

    # Create backup script
    cat > "$CONFIG_DIR/backup.sh" << EOF
#!/bin/bash

BACKUP_DIR="$BACKUP_DIR"
TIMESTAMP=\$(date +"%Y%m%d_%H%M%S")
DB_NAME="atlas_ai"

# Create backup directory
mkdir -p "\$BACKUP_DIR"

# Backup MongoDB
mongodump --host localhost:27017 --db "\$DB_NAME" --username atlas_user --password "$DB_PASSWORD" --out "\$BACKUP_DIR/mongodb_\$TIMESTAMP"

# Compress backup
tar -czf "\$BACKUP_DIR/mongodb_backup_\$TIMESTAMP.tar.gz" -C "\$BACKUP_DIR" "mongodb_\$TIMESTAMP"

# Remove uncompressed dump
rm -rf "\$BACKUP_DIR/mongodb_\$TIMESTAMP"

# Backup application files
tar -czf "\$BACKUP_DIR/app_backup_\$TIMESTAMP.tar.gz" -C "$INSTALL_DIR" .

# Keep only last 7 backups
cd "\$BACKUP_DIR"
ls -t mongodb_backup_*.tar.gz | tail -n +8 | xargs -r rm
ls -t app_backup_*.tar.gz | tail -n +8 | xargs -r rm

echo "\$(date): Backup completed" >> "/var/log/atlas-ai/backup.log"
EOF

    chmod +x "$CONFIG_DIR/backup.sh"

    # Add to crontab (daily at 2 AM)
    (crontab -l 2>/dev/null; echo "0 2 * * * $CONFIG_DIR/backup.sh") | crontab -

    log "Backup system setup completed"
}

################################################################################
# Log Rotation
################################################################################

setup_log_rotation() {
    log "Setting up log rotation..."

    cat > /etc/logrotate.d/atlas-ai << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 atlas atlas
    postrotate
        pm2 restart atlas-backend > /dev/null 2>&1 || true
    endscript
}

/var/log/nginx/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}
EOF

    log "Log rotation configured"
}

################################################################################
# Final Setup
################################################################################

create_update_script() {
    log "Creating update script..."

    cat > "$CONFIG_DIR/update.sh" << EOF
#!/bin/bash

set -euo pipefail

INSTALL_DIR="$INSTALL_DIR"
BACKUP_DIR="$BACKUP_DIR"
TIMESTAMP=\$(date +"%Y%m%d_%H%M%S")

echo "Starting Atlas AI update..."

# Create backup before update
echo "Creating backup..."
$CONFIG_DIR/backup.sh

# Stop application
echo "Stopping application..."
pm2 stop atlas-backend

# Backup current version
cp -r "\$INSTALL_DIR" "\$BACKUP_DIR/app_pre_update_\$TIMESTAMP"

# Pull latest changes
cd "\$INSTALL_DIR"
git pull origin main

# Update backend
cd "\$INSTALL_DIR/Back"
npm ci --production
npm run build

# Update frontend
cd "\$INSTALL_DIR/Front"
npm ci --production
npm run build
cp -r dist/* /var/www/atlas-ai/ || cp -r build/* /var/www/atlas-ai/

# Restart application
echo "Restarting application..."
pm2 restart atlas-backend

# Test health
sleep 10
if curl -f -s "http://localhost:$BACKEND_PORT/health" > /dev/null; then
    echo "✅ Update completed successfully"
else
    echo "❌ Update failed - health check failed"
    exit 1
fi
EOF

    chmod +x "$CONFIG_DIR/update.sh"

    log "Update script created at $CONFIG_DIR/update.sh"
}

save_installation_info() {
    log "Saving installation information..."

    cat > "$CONFIG_DIR/installation-info.json" << EOF
{
    "version": "$SCRIPT_VERSION",
    "installation_date": "$(date -Iseconds)",
    "domain": "$DOMAIN",
    "email": "$EMAIL",
    "environment": "$ENVIRONMENT",
    "frontend_port": "$FRONTEND_PORT",
    "backend_port": "$BACKEND_PORT",
    "os_type": "$OS_TYPE",
    "os_version": "$OS_VERSION",
    "ssl_enabled": $(if [[ "$SKIP_SSL" == "false" ]]; then echo "true"; else echo "false"; fi),
    "directories": {
        "install": "$INSTALL_DIR",
        "logs": "$LOG_DIR",
        "backup": "$BACKUP_DIR",
        "config": "$CONFIG_DIR"
    }
}
EOF

    # Save passwords securely
    cat > "$CONFIG_DIR/secrets.txt" << EOF
Database Password: $DB_PASSWORD
Session Secret: $SESSION_SECRET
Gemini API Key: $GEMINI_API_KEY
EOF

    chmod 600 "$CONFIG_DIR/secrets.txt"

    log "Installation information saved"
}

display_final_info() {
    log "Installation completed successfully!"

    echo ""
    echo -e "${GREEN}🎉 Atlas AI Support Assistant has been installed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Application URLs:${NC}"
    if [[ "$SKIP_SSL" == "false" ]]; then
        echo -e "  Frontend: https://$DOMAIN"
        echo -e "  Backend API: https://$DOMAIN/api/v1"
        echo -e "  Health Check: https://$DOMAIN/health"
    else
        echo -e "  Frontend: http://$DOMAIN"
        echo -e "  Backend API: http://$DOMAIN/api/v1"
        echo -e "  Health Check: http://$DOMAIN/health"
    fi
    echo ""
    echo -e "${BLUE}Default Login Credentials:${NC}"
    echo -e "  Username: admin"
    echo -e "  Password: PassWD"
    echo ""
    echo -e "${BLUE}Important Files:${NC}"
    echo -e "  Installation Info: $CONFIG_DIR/installation-info.json"
    echo -e "  Secrets: $CONFIG_DIR/secrets.txt"
    echo -e "  Update Script: $CONFIG_DIR/update.sh"
    echo -e "  Backup Script: $CONFIG_DIR/backup.sh"
    echo ""
    echo -e "${BLUE}Useful Commands:${NC}"
    echo -e "  Check Status: pm2 status"
    echo -e "  View Logs: pm2 logs atlas-backend"
    echo -e "  Restart App: pm2 restart atlas-backend"
    echo -e "  Update App: $CONFIG_DIR/update.sh"
    echo -e "  Manual Backup: $CONFIG_DIR/backup.sh"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo -e "  1. Update the Gemini API key in the admin panel"
    echo -e "  2. Configure SMTP settings for email notifications"
    echo -e "  3. Set up your knowledge base"
    echo -e "  4. Create additional user accounts"
    echo ""
    echo -e "${GREEN}Support: Check the documentation at $INSTALL_DIR/Auto Install/docs/${NC}"
}

################################################################################
# Error Handling
################################################################################

cleanup_on_error() {
    error "Installation failed. Cleaning up..."
    execute_rollback

    echo ""
    echo -e "${RED}❌ Installation failed!${NC}"
    echo -e "${YELLOW}Check the error log: $ERROR_LOG${NC}"
    echo -e "${YELLOW}For support, visit: https://github.com/your-username/atlas-ai/issues${NC}"

    exit 1
}

# Set up error handling
trap cleanup_on_error ERR

################################################################################
# Main Installation Flow
################################################################################

main() {
    # Check for help first (before requiring root)
    for arg in "$@"; do
        if [[ "$arg" == "--help" ]]; then
            show_help
            exit 0
        fi
    done

    # Initial setup
    check_root
    check_internet
    setup_directories

    # Parse command line arguments first (to get any provided values)
    parse_arguments "$@"

    # Prompt for missing required information interactively
    prompt_user_input

    log "Starting Atlas AI Support Assistant installation v$SCRIPT_VERSION"
    log "Domain: $DOMAIN, Environment: $ENVIRONMENT"

    # System detection and setup
    detect_os
    update_system
    install_dependencies
    install_nodejs
    install_mongodb
    configure_mongodb

    # Application deployment
    clone_repository
    setup_backend
    setup_frontend
    setup_pm2

    # Web server and security
    configure_nginx
    setup_ssl
    configure_firewall
    configure_fail2ban

    # Monitoring and maintenance
    setup_monitoring
    setup_backup
    setup_log_rotation

    # Final setup
    create_update_script
    save_installation_info
    display_final_info

    log "Installation completed in $(date)"
}

# Run main function with all arguments
main "$@"