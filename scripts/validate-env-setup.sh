#!/bin/bash

# ========================================
# FindoTrip Environment Validation Script
# ========================================
# This script validates your environment setup

echo "🔍 FindoTrip Environment Validator"
echo "==================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if variable is set
check_var() {
    local var_name=$1
    local var_value=$2
    local required=${3:-false}

    if [ -z "$var_value" ]; then
        if [ "$required" = "true" ]; then
            echo -e "${RED}❌ $var_name is REQUIRED but not set${NC}"
            return 1
        else
            echo -e "${YELLOW}⚠️  $var_name is optional and not set${NC}"
            return 0
        fi
    else
        if [ "$required" = "true" ]; then
            echo -e "${GREEN}✅ $var_name is set${NC}"
            return 0
        else
            echo -e "${GREEN}✅ $var_name is set (optional)${NC}"
            return 0
        fi
    fi
}

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Run this script from your application root directory."
    exit 1
fi

echo "Checking environment variables..."
echo ""

# Load environment variables
set -a
source .env
set +a

# Required variables
echo "REQUIRED VARIABLES:"
echo "-------------------"
check_var "DATABASE_URL" "$DATABASE_URL" true
check_var "SESSION_SECRET" "$SESSION_SECRET" true
check_var "APP_URL" "$APP_URL" true
echo ""

# Optional but recommended variables
echo "RECOMMENDED VARIABLES:"
echo "----------------------"
check_var "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY" false
check_var "STRIPE_PUBLISHABLE_KEY" "$STRIPE_PUBLISHABLE_KEY" false
check_var "CLOUDINARY_CLOUD_NAME" "$CLOUDINARY_CLOUD_NAME" false
check_var "CLOUDINARY_API_KEY" "$CLOUDINARY_API_KEY" false
check_var "CLOUDINARY_API_SECRET" "$CLOUDINARY_API_SECRET" false
check_var "SENDGRID_API_KEY" "$SENDGRID_API_KEY" false
check_var "ADMIN_EMAIL" "$ADMIN_EMAIL" false
check_var "ADMIN_PASSWORD" "$ADMIN_PASSWORD" false
echo ""

# Optional OAuth variables
echo "OAUTH VARIABLES (Optional):"
echo "---------------------------"
check_var "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID" false
check_var "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET" false
check_var "FACEBOOK_CLIENT_ID" "$FACEBOOK_CLIENT_ID" false
check_var "FACEBOOK_CLIENT_SECRET" "$FACEBOOK_CLIENT_SECRET" false
echo ""

# Security checks
echo "SECURITY CHECKS:"
echo "----------------"

# Check SESSION_SECRET length
if [ ! -z "$SESSION_SECRET" ]; then
    SECRET_LENGTH=${#SESSION_SECRET}
    if [ $SECRET_LENGTH -lt 32 ]; then
        echo -e "${RED}❌ SESSION_SECRET is too short ($SECRET_LENGTH chars). Use at least 32 characters.${NC}"
    else
        echo -e "${GREEN}✅ SESSION_SECRET length is good ($SECRET_LENGTH chars)${NC}"
    fi
fi

# Check if APP_URL uses HTTPS in production
if [ "$NODE_ENV" = "production" ] && [ ! -z "$APP_URL" ]; then
    if [[ $APP_URL != https://* ]]; then
        echo -e "${YELLOW}⚠️  APP_URL should use HTTPS in production${NC}"
    else
        echo -e "${GREEN}✅ APP_URL uses HTTPS${NC}"
    fi
fi

# Check NODE_ENV
if [ "$NODE_ENV" = "production" ]; then
    echo -e "${GREEN}✅ NODE_ENV is set to production${NC}"
else
    echo -e "${YELLOW}⚠️  NODE_ENV is not set to production (current: $NODE_ENV)${NC}"
fi

echo ""
echo "==========================================="
echo "📋 NEXT STEPS:"
echo "==========================================="

# Database test suggestion
if [ ! -z "$DATABASE_URL" ]; then
    echo "• Test database connection: npx prisma db push"
fi

# Build test
echo "• Test build: npm run build"

# Start test
echo "• Test application: timeout 10s npm start"

# SSL setup
if [[ $APP_URL == https://* ]]; then
    echo "• SSL is configured (good!)"
else
    echo "• Set up SSL: sudo certbot --nginx -d yourdomain.com"
fi

echo ""
echo "📖 For complete setup guide, see: ENVIRONMENT_SETUP_GUIDE.md"
echo "🔐 Generate secure secrets: ./scripts/generate-env-secrets.sh"
