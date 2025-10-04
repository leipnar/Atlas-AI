#!/bin/bash

# Atlas AI Support Assistant - VPS Deployment Script
# This script deploys the updated code to your VPS server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VPS_USER=${VPS_USER:-"root"}
VPS_HOST=${VPS_HOST:-"atlas.leipnar.com"}
VPS_PATH=${VPS_PATH:-"/var/www/atlas-ai"}
BACKUP_DIR="${VPS_PATH}/backups/$(date +%Y%m%d_%H%M%S)"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Atlas AI - VPS Deployment Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Step 1: Verify local build
echo -e "${YELLOW}Step 1: Verifying local build...${NC}"
if [ ! -d "backend/dist" ]; then
    echo -e "${RED}Error: dist/ directory not found. Please run 'npm run build' first${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Local build verified${NC}"
echo ""

# Step 2: Create backup on VPS
echo -e "${YELLOW}Step 2: Creating backup on VPS...${NC}"
ssh ${VPS_USER}@${VPS_HOST} "mkdir -p ${BACKUP_DIR}"
ssh ${VPS_USER}@${VPS_HOST} "cp -r ${VPS_PATH}/backend/src ${BACKUP_DIR}/"
echo -e "${GREEN}✓ Backup created at: ${BACKUP_DIR}${NC}"
echo ""

# Step 3: Upload updated files
echo -e "${YELLOW}Step 3: Uploading updated files to VPS...${NC}"

# Upload backend TypeScript source files
echo "  - Uploading backend source files..."
scp -r backend/src ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/backend/

# Upload configuration files
echo "  - Uploading configuration files..."
scp backend/tsconfig.json ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/backend/
scp backend/package.json ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/backend/
scp backend/package-lock.json ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/backend/

# Upload documentation
echo "  - Uploading documentation..."
scp PASSKEY_DEPLOYMENT_GUIDE.md ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/
scp CHANGELOG.md ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/

echo -e "${GREEN}✓ Files uploaded${NC}"
echo ""

# Step 4: Install dependencies and build on VPS
echo -e "${YELLOW}Step 4: Installing dependencies and building on VPS...${NC}"
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
cd /var/www/atlas-ai/backend
echo "  - Installing dependencies..."
npm install
echo "  - Building TypeScript..."
npm run build
ENDSSH
echo -e "${GREEN}✓ Build completed on VPS${NC}"
echo ""

# Step 5: Clear passkey credentials in database
echo -e "${YELLOW}Step 5: Clearing old passkey credentials...${NC}"
read -p "Do you want to clear existing passkey credentials? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
mongosh atlas_ai --eval '
db.users.updateMany(
  {},
  {
    $set: {
      passkeyCredentials: [],
      currentChallenge: null
    }
  }
)
'
ENDSSH
    echo -e "${GREEN}✓ Passkey credentials cleared${NC}"
else
    echo -e "${YELLOW}⊘ Skipped clearing passkey credentials${NC}"
fi
echo ""

# Step 6: Restart server
echo -e "${YELLOW}Step 6: Restarting server...${NC}"
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
cd /var/www/atlas-ai/backend
pm2 restart atlas-backend || pm2 start dist/server.js --name atlas-backend
pm2 save
ENDSSH
echo -e "${GREEN}✓ Server restarted${NC}"
echo ""

# Step 7: Verify deployment
echo -e "${YELLOW}Step 7: Verifying deployment...${NC}"
sleep 3
ssh ${VPS_USER}@${VPS_HOST} "pm2 logs atlas-backend --lines 20 --nostream"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete! 🎉${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo -e "1. Test passkey registration at: https://atlas.leipnar.com"
echo -e "2. Users must re-register their passkeys"
echo -e "3. Monitor logs: ${YELLOW}ssh ${VPS_USER}@${VPS_HOST} 'pm2 logs atlas-backend'${NC}"
echo ""
echo -e "${GREEN}Backup Location:${NC} ${BACKUP_DIR}"
echo ""
