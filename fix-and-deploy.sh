#!/bin/bash
# Complete fix and deployment script for Atlas AI
# Run this on your VPS: ssh root@atlas.leipnar.com, then: bash fix-and-deploy.sh

set -e  # Exit on error

echo "========================================="
echo "Atlas AI - Complete Fix & Deployment"
echo "========================================="
echo ""

# Step 1: Check admin user exists
echo "Step 1: Checking admin user..."
ADMIN_EXISTS=$(mongo atlas_ai --quiet --eval 'db.users.findOne({role: "Admin"}) ? "yes" : "no"')

if [ "$ADMIN_EXISTS" = "no" ]; then
    echo "❌ No admin user found! Creating one..."

    # Generate bcrypt hash for password "password"
    PASSWORD_HASH='$2b$10$YQiGoQrY7vF4OyB.zvNkKejPzVg7lT4a8hPoYPZ8nLm7yCqN8Qzha'

    mongo atlas_ai --quiet --eval "
    db.users.insertOne({
        username: 'admin',
        email: 'admin@atlas.leipnar.com',
        password: '$PASSWORD_HASH',
        role: 'Admin',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        passkeyCredentials: [],
        currentChallenge: null
    });
    print('✅ Admin user created: username=admin, password=password');
    "
else
    echo "✅ Admin user exists"
    mongo atlas_ai --quiet --eval 'db.users.findOne({role: "Admin"}, {username: 1, email: 1})'
fi
echo ""

# Step 2: Navigate to project directory
echo "Step 2: Navigating to project..."
cd /var/www/atlas-ai
echo "✅ In directory: $(pwd)"
echo ""

# Step 3: Pull latest code from GitHub
echo "Step 3: Pulling latest code from GitHub..."
git fetch origin
git status
echo ""
read -p "Pull latest code? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git pull origin main
    echo "✅ Code updated"
else
    echo "⊘ Skipped git pull"
fi
echo ""

# Step 4: Check current git commit
echo "Step 4: Current git version:"
git log --oneline -3
echo ""

# Step 5: Install dependencies and build
echo "Step 5: Building backend..."
cd backend

echo "  - Installing dependencies..."
npm install

echo "  - Building TypeScript..."
npm run build

if [ -d "dist" ]; then
    echo "✅ Build successful - dist/ folder created"
    ls -lh dist/ | head -10
else
    echo "❌ Build failed - dist/ folder not found!"
    exit 1
fi
echo ""

# Step 6: Check PM2 configuration
echo "Step 6: Checking PM2 configuration..."
PM2_SCRIPT=$(pm2 describe atlas-backend 2>/dev/null | grep "script path" | awk '{print $NF}' || echo "unknown")
echo "Current PM2 script: $PM2_SCRIPT"

if [[ "$PM2_SCRIPT" == *"dist/server.js"* ]]; then
    echo "✅ PM2 is configured correctly (using compiled code)"
else
    echo "⚠️  PM2 is using wrong script. Reconfiguring..."
    pm2 delete atlas-backend || true
    pm2 start dist/server.js --name atlas-backend --env production
    pm2 save
    echo "✅ PM2 reconfigured to use dist/server.js"
fi
echo ""

# Step 7: Clear old passkey credentials
echo "Step 7: Clearing old passkey credentials..."
read -p "Clear existing passkeys? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    mongo atlas_ai --quiet --eval 'db.users.updateMany({}, {$set: {passkeyCredentials: [], currentChallenge: null}})'
    echo "✅ Passkey credentials cleared"
else
    echo "⊘ Skipped clearing passkeys"
fi
echo ""

# Step 8: Restart server
echo "Step 8: Restarting server..."
pm2 restart atlas-backend
sleep 2
pm2 status
echo ""

# Step 9: Check logs for errors
echo "Step 9: Checking server logs..."
echo "Recent logs (last 20 lines):"
pm2 logs atlas-backend --lines 20 --nostream
echo ""

# Step 10: Verify deployment
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "✅ Admin credentials:"
echo "   Username: admin"
echo "   Password: password"
echo ""
echo "✅ Next steps:"
echo "   1. Test login at: https://atlas.leipnar.com"
echo "   2. Login with admin/password"
echo "   3. Go to profile and register a passkey"
echo "   4. Test passkey login"
echo ""
echo "📊 Monitor logs with: pm2 logs atlas-backend"
echo ""
