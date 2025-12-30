#!/bin/bash

# ========================================
# FindoTrip Environment Secrets Generator
# ========================================
# This script helps generate secure secrets for your .env file

echo "🔐 FindoTrip Environment Secrets Generator"
echo "=========================================="
echo ""

# Function to generate a secure random string
generate_secret() {
    local length=$1
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

echo "Generating secure secrets..."
echo ""

# Generate SESSION_SECRET (64 characters)
SESSION_SECRET=$(generate_secret 64)
echo "SESSION_SECRET=\"$SESSION_SECRET\""
echo ""

# Generate JWT_SECRET (64 characters)
JWT_SECRET=$(generate_secret 64)
echo "JWT_SECRET=\"$JWT_SECRET\""
echo ""

# Generate ADMIN_PASSWORD (16 characters, alphanumeric)
ADMIN_PASSWORD=$(generate_secret 16)
echo "ADMIN_PASSWORD=\"$ADMIN_PASSWORD\""
echo ""

echo "=========================================="
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "=========================================="
echo "1. Save these secrets securely - you'll need them for your .env file"
echo "2. Never share these secrets publicly"
echo "3. Use different secrets for development and production"
echo "4. Rotate these secrets periodically for security"
echo ""
echo "Copy these values to your .env file:"
echo "SESSION_SECRET=\"$SESSION_SECRET\""
echo "JWT_SECRET=\"$JWT_SECRET\""
echo "ADMIN_PASSWORD=\"$ADMIN_PASSWORD\""
echo ""

# Optional: Generate additional secrets if requested
read -p "Generate additional secrets? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Additional secrets for advanced configuration:"
    echo ""

    # Stripe webhook secret placeholder
    STRIPE_WEBHOOK_SECRET=$(generate_secret 32)
    echo "STRIPE_WEBHOOK_SECRET=\"whsec_$STRIPE_WEBHOOK_SECRET\""
    echo ""

    # VAPID keys for push notifications
    VAPID_PRIVATE_KEY=$(generate_secret 32)
    VAPID_PUBLIC_KEY=$(generate_secret 32)
    echo "VAPID_PRIVATE_KEY=\"$VAPID_PRIVATE_KEY\""
    echo "VAPID_PUBLIC_KEY=\"$VAPID_PUBLIC_KEY\""
    echo ""
fi

echo "✅ Secret generation complete!"
echo "📄 See ENVIRONMENT_SETUP_GUIDE.md for complete setup instructions"
