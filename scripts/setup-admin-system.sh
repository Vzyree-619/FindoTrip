#!/bin/bash

# ========================================
# FINDOTRIP ADMIN SYSTEM SETUP SCRIPT
# ========================================

echo "🚀 Setting up FindoTrip Admin System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version check passed: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "npm is available: $(npm -v)"

# Install dependencies
print_status "Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from template..."
    if [ -f "env.example" ]; then
        cp env.example .env
        print_success ".env file created from template"
        print_warning "Please update .env file with your actual values before continuing"
    else
        print_error "env.example file not found. Please create .env file manually"
        exit 1
    fi
else
    print_success ".env file found"
fi

# Check if Prisma is installed
if ! command -v npx prisma &> /dev/null; then
    print_error "Prisma CLI not found. Installing Prisma..."
    npm install -g prisma
fi

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate

if [ $? -eq 0 ]; then
    print_success "Prisma client generated successfully"
else
    print_error "Failed to generate Prisma client"
    exit 1
fi

# Push database schema
print_status "Pushing database schema..."
npx prisma db push

if [ $? -eq 0 ]; then
    print_success "Database schema pushed successfully"
else
    print_error "Failed to push database schema"
    print_warning "Please check your DATABASE_URL in .env file"
    exit 1
fi

# Seed database (if seed file exists)
if [ -f "prisma/seed.ts" ]; then
    print_status "Seeding database..."
    npm run db:seed
    
    if [ $? -eq 0 ]; then
        print_success "Database seeded successfully"
    else
        print_warning "Database seeding failed (this is optional)"
    fi
fi

# Check if all required environment variables are set
print_status "Checking environment variables..."

# Required variables
REQUIRED_VARS=(
    "DATABASE_URL"
    "SESSION_SECRET"
    "JWT_SECRET"
    "APP_URL"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    print_error "Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    print_warning "Please update your .env file with the missing variables"
    exit 1
fi

print_success "All required environment variables are set"

# Create admin user (if script exists)
if [ -f "scripts/create-admin-user.ts" ]; then
    print_status "Creating admin user..."
    npx tsx scripts/create-admin-user.ts
    
    if [ $? -eq 0 ]; then
        print_success "Admin user created successfully"
    else
        print_warning "Failed to create admin user (you can create it manually later)"
    fi
fi

# Run type checking
print_status "Running type checking..."
npm run typecheck

if [ $? -eq 0 ]; then
    print_success "Type checking passed"
else
    print_warning "Type checking failed (this is optional for development)"
fi

# Run linting
print_status "Running linting..."
npm run lint

if [ $? -eq 0 ]; then
    print_success "Linting passed"
else
    print_warning "Linting failed (this is optional for development)"
fi

# Final success message
echo ""
print_success "🎉 FindoTrip Admin System setup completed successfully!"
echo ""
print_status "Next steps:"
echo "1. Update your .env file with actual values"
echo "2. Start the development server: npm run dev"
echo "3. Access the admin panel at: http://localhost:3000/admin"
echo "4. Login with your admin credentials"
echo ""
print_status "Admin System Features:"
echo "✅ Support ticket management"
echo "✅ Review moderation"
echo "✅ Financial management"
echo "✅ Platform settings"
echo "✅ Analytics & reporting"
echo "✅ System monitoring"
echo "✅ User management"
echo ""
print_status "For more information, check the documentation:"
echo "- docs/admin-user-guide.md"
echo "- docs/api-integration-guide.md"
echo "- ADMIN_SYSTEM_COMPLETE.md"
echo ""
print_success "Happy administering! 🚀"
