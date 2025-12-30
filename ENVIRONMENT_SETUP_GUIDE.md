# Environment Variables Setup Guide for FindoTrip VPS

This guide provides a complete walkthrough for setting up environment variables on your Ubuntu VPS for the FindoTrip application.

## Prerequisites

Before setting up environment variables, ensure you have:
- ✅ Ubuntu VPS with Jenkins, Nginx, and PM2 installed (via the setup script)
- ✅ MongoDB database (local or cloud)
- ✅ Domain name configured (for production)
- ✅ SSL certificate (optional but recommended)

## Quick Setup (Automated)

The Jenkins setup script creates an automated setup script. After deployment:

```bash
# Navigate to your application directory
cd /var/www/findotrip

# Run the automated setup script
sudo -u findotrip ./setup-env.sh
```

## Helper Scripts

I've created two helper scripts to make setup easier:

### Generate Secure Secrets
```bash
# Generate cryptographically secure secrets
./scripts/generate-env-secrets.sh
```

### Validate Your Setup
```bash
# Check if your environment variables are properly configured
./scripts/validate-env-setup.sh
```

This will prompt you for the essential variables and create a `.env` file.

## Manual Setup

If you prefer to set up environment variables manually:

```bash
# Navigate to your application directory
cd /var/www/findotrip

# Create .env file
sudo -u findotrip nano .env
```

Copy the following template and fill in your values:

```env
# ========================================
# FINDOTRIP PRODUCTION ENVIRONMENT VARIABLES
# ========================================

# Database (REQUIRED)
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/dbname"

# Authentication & Security (REQUIRED)
SESSION_SECRET="your-super-secure-random-string-here-at-least-32-characters"
JWT_SECRET="another-super-secure-random-string-here-at-least-32-characters"

# Application Settings (REQUIRED)
APP_URL="https://yourdomain.com"
NODE_ENV="production"
PORT=3000

# File Upload - Cloudinary (RECOMMENDED)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Payment Processing - Stripe (REQUIRED for payments)
STRIPE_SECRET_KEY="sk_live_..."  # Use live keys for production
STRIPE_PUBLISHABLE_KEY="pk_live_..."  # Use live keys for production
STRIPE_WEBHOOK_SECRET="whsec_..."  # For webhook handling

# OAuth - Google Login (OPTIONAL)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="https://yourdomain.com/auth/google/callback"

# OAuth - Facebook Login (OPTIONAL)
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"
FACEBOOK_CALLBACK_URL="https://yourdomain.com/auth/facebook/callback"

# Email Service - SendGrid (RECOMMENDED)
SENDGRID_API_KEY="SG.xxxxx"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"

# Admin Account (REQUIRED - First-time setup)
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="ChangeThisSecurePassword123!"

# Redis (OPTIONAL - for better performance)
REDIS_URL="redis://localhost:6379"

# Security Settings
BCRYPT_ROUNDS="12"
JWT_EXPIRES_IN="7d"
SESSION_MAX_AGE="604800000"

# Production Settings
DEBUG="false"
LOG_LEVEL="warn"
```

## Step-by-Step Configuration Guide

### 1. Database Setup (REQUIRED)

**Option A: MongoDB Atlas (Cloud - Recommended)**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free cluster
3. Create a database user with read/write access
4. Get your connection string
5. Replace `<username>`, `<password>`, and `<database>` in:
   ```
   DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/dbname"
   ```

**Option B: Local MongoDB**
1. Install MongoDB on your VPS:
   ```bash
   sudo apt update
   sudo apt install -y mongodb
   sudo systemctl start mongodb
   sudo systemctl enable mongodb
   ```
2. Use local connection:
   ```
   DATABASE_URL="mongodb://localhost:27017/findotrip"
   ```

### 2. Session Secret (REQUIRED)

Generate a secure random string:
```bash
# Generate a 64-character random string
openssl rand -base64 48
```

Use this for both `SESSION_SECRET` and `JWT_SECRET`.

### 3. Application URL (REQUIRED)

Set this to your production domain:
```
APP_URL="https://yourdomain.com"
```

### 4. File Upload Setup (RECOMMENDED)

**Cloudinary (Recommended):**
1. Go to [Cloudinary](https://cloudinary.com/)
2. Create a free account
3. Get your Cloud Name, API Key, and API Secret from Dashboard
4. Add to your `.env` file

**Alternative: Local uploads**
- Files will be stored in `public/uploads/` directory
- Less scalable but works without external services

### 5. Payment Processing (REQUIRED for bookings)

**Stripe Setup:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create an account
3. Get your **Live** API keys (not test keys for production!)
4. Add to your `.env` file

### 6. OAuth Setup (OPTIONAL but recommended)

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://yourdomain.com/auth/google/callback`
6. Add credentials to `.env`

**Facebook OAuth:**
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs
5. Add credentials to `.env`

### 7. Email Service (RECOMMENDED)

**SendGrid (Recommended):**
1. Go to [SendGrid](https://sendgrid.com/)
2. Create account and verify domain
3. Get API key
4. Add to `.env`

### 8. Admin Account Setup (REQUIRED)

Set up your first admin account:
```
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="SuperSecurePassword123!"
```

**Important:** Change the password after first login!

## Verification Steps

After setting up environment variables:

```bash
# Navigate to app directory
cd /var/www/findotrip

# Test database connection
sudo -u findotrip npx prisma db push

# Test application build
sudo -u findotrip npm run build

# Test application start (should start on port 3000)
sudo -u findotrip timeout 10s npm start || true
```

## Troubleshooting

### Database Connection Issues
```bash
# Test MongoDB connection
mongosh "your-connection-string"
```

### Environment Variables Not Loading
```bash
# Run the validation script to check your setup
./scripts/validate-env-setup.sh

# Or manually check if .env file exists and has correct permissions
ls -la .env

# Verify variables are loaded
sudo -u findotrip node -e "console.log('DATABASE_URL:', process.env.DATABASE_URL)"
```

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs findotrip

# Check application logs
tail -f /root/.pm2/logs/findotrip-error.log
tail -f /root/.pm2/logs/findotrip-out.log
```

### SSL/HTTPS Issues
Ensure your `APP_URL` uses `https://` for production.

## Security Best Practices

1. **Never commit `.env` to git** - It's in `.gitignore`
2. **Use strong, unique secrets** for SESSION_SECRET and JWT_SECRET
3. **Use production API keys** - Never test keys in production
4. **Restrict database access** - Only allow necessary IP addresses
5. **Regularly rotate secrets** - Change them periodically
6. **Use HTTPS** - Always use `https://` URLs

## Optional Advanced Configuration

### Redis Setup (Performance)
```bash
# Install Redis
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Add to .env
REDIS_URL="redis://localhost:6379"
```

### Rate Limiting Configuration
```env
RATE_LIMIT_WINDOW_MS="900000"  # 15 minutes
RATE_LIMIT_MAX_REQUESTS="100"  # requests per window
```

### Email Templates
Customize email templates in your SendGrid account for:
- Booking confirmations
- Payment receipts
- Password resets
- Admin notifications

## Support

If you encounter issues:
1. Check the PM2 logs: `pm2 logs findotrip`
2. Verify all required environment variables are set
3. Ensure database is accessible
4. Check that all external services (Stripe, Cloudinary, etc.) are properly configured

## Next Steps

After environment setup:
1. ✅ Test the application: `npm start`
2. ✅ Set up SSL certificate: `certbot --nginx -d yourdomain.com`
3. ✅ Configure automated backups for your database
4. ✅ Set up monitoring (optional)

Your FindoTrip application should now be fully functional on your VPS!
