# 🔌 **API INTEGRATION GUIDE**

## 📋 **REQUIRED API KEYS AND SERVICES**

This guide covers all the API keys and services needed to run the FindoTrip platform successfully.

---

## 🗄️ **1. DATABASE**

### **MongoDB**
- **Purpose**: Primary database for all platform data
- **Required**: ✅ YES
- **Setup Instructions**:
  1. Sign up at [https://www.mongodb.com/](https://www.mongodb.com/)
  2. Create a new cluster
  3. Get your connection string
  4. Add to `.env` file as: `DATABASE_URL`

**Environment Variable:**
```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/dbname"
```

---

## 📁 **2. FILE UPLOAD SERVICE**

### **Cloudinary (Recommended)**
- **Purpose**: Image and file uploads for properties, vehicles, tours, and user profiles
- **Required**: ✅ YES for file uploads to work
- **Setup Instructions**:
  1. Sign up at [https://cloudinary.com/](https://cloudinary.com/)
  2. Get your credentials from the Dashboard
  3. Add to `.env` file

**Environment Variables:**
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### **Alternative: AWS S3**
- **Purpose**: Alternative file storage solution
- **Required**: ❌ NO (use if you prefer AWS S3 over Cloudinary)
- **Setup Instructions**:
  1. Create AWS account
  2. Create S3 bucket
  3. Generate access keys
  4. Add to `.env` file

**Environment Variables:**
```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_BUCKET_NAME=your-bucket
AWS_REGION=us-east-1
```

---

## 💳 **3. PAYMENT PROCESSING**

### **Stripe (Primary)**
- **Purpose**: Process payments and refunds for bookings
- **Required**: ✅ YES for bookings to work
- **Setup Instructions**:
  1. Sign up at [https://stripe.com/](https://stripe.com/)
  2. Get API keys from Dashboard
  3. Use test mode for development, live mode for production
  4. Add to `.env` file

**Environment Variables:**
```env
STRIPE_SECRET_KEY=sk_test_... (test mode)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### **PayPal (Optional Backup)**
- **Purpose**: Alternative payment method
- **Required**: ❌ NO (optional backup payment method)
- **Setup Instructions**:
  1. Create PayPal Developer account
  2. Create application
  3. Get client ID and secret
  4. Add to `.env` file

**Environment Variables:**
```env
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_SECRET=your-secret
PAYPAL_MODE=sandbox (or "live")
```

---

## 📧 **4. EMAIL SERVICE**

### **SendGrid (Recommended)**
- **Purpose**: Send transactional emails (confirmations, notifications, etc.)
- **Required**: ✅ YES for notifications to work
- **Setup Instructions**:
  1. Sign up at [https://sendgrid.com/](https://sendgrid.com/)
  2. Create API key
  3. Verify sender email
  4. Add to `.env` file

**Environment Variables:**
```env
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### **Alternative: Resend**
- **Purpose**: Alternative email service
- **Required**: ❌ NO (use if you prefer Resend over SendGrid)
- **Setup Instructions**:
  1. Sign up at [https://resend.com/](https://resend.com/)
  2. Get API key
  3. Add to `.env` file

**Environment Variables:**
```env
RESEND_API_KEY=re_xxxxx
```

### **Alternative: SMTP (Any Provider)**
- **Purpose**: Use your own SMTP server
- **Required**: ❌ NO (use if you have your own SMTP server)
- **Setup Instructions**:
  1. Get SMTP credentials from your email provider
  2. Add to `.env` file

**Environment Variables:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 📱 **5. SMS SERVICE (Optional but Recommended)**

### **Twilio**
- **Purpose**: Send SMS notifications to users
- **Required**: ❌ NO (optional for SMS notifications)
- **Setup Instructions**:
  1. Sign up at [https://www.twilio.com/](https://www.twilio.com/)
  2. Get credentials from console
  3. Buy a phone number
  4. Add to `.env` file

**Environment Variables:**
```env
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 🗺️ **6. MAPS SERVICE (Optional)**

### **Google Maps API**
- **Purpose**: Show location maps for properties and services
- **Required**: ❌ NO (maps will show placeholder if not configured)
- **Setup Instructions**:
  1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
  2. Enable Maps JavaScript API
  3. Get API key
  4. Add to `.env` file

**Environment Variables:**
```env
GOOGLE_MAPS_API_KEY=AIzaxxxxx
```

---

## 🔐 **7. AUTHENTICATION SECRETS**

### **Session & JWT**
- **Purpose**: Secure authentication and session management
- **Required**: ✅ YES
- **Setup Instructions**:
  1. Generate random secure strings
  2. Add to `.env` file

**Environment Variables:**
```env
SESSION_SECRET=your-random-secure-string-here
JWT_SECRET=another-random-secure-string
```

**To generate secure strings:**
- **Node.js**: `require('crypto').randomBytes(32).toString('hex')`
- **Online**: [https://www.uuidgenerator.net/](https://www.uuidgenerator.net/)

---

## ⚙️ **8. APPLICATION SETTINGS**

### **General**
- **Required**: ✅ YES
- **Setup Instructions**:
  1. Set your application URL
  2. Set environment (development/production)
  3. Set port number
  4. Add to `.env` file

**Environment Variables:**
```env
APP_URL=http://localhost:3000 (development)
NODE_ENV=development
PORT=3000
```

---

## 📄 **COMPLETE .env.example FILE**

Create this file at your project root with all variables:

```env
# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/dbname"

# Authentication
SESSION_SECRET="generate-a-random-secure-string-here"
JWT_SECRET="another-random-secure-string-here"

# Application
APP_URL="http://localhost:3000"
NODE_ENV="development"
PORT=3000

# File Upload - Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# OR File Upload - AWS S3
# AWS_ACCESS_KEY_ID="your-access-key"
# AWS_SECRET_ACCESS_KEY="your-secret"
# AWS_BUCKET_NAME="your-bucket"
# AWS_REGION="us-east-1"

# Payment - Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Payment - PayPal (Optional)
# PAYPAL_CLIENT_ID="your-client-id"
# PAYPAL_SECRET="your-secret"
# PAYPAL_MODE="sandbox"

# Email - SendGrid
SENDGRID_API_KEY="SG.xxxxx"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"

# OR Email - Resend
# RESEND_API_KEY="re_xxxxx"

# OR Email - SMTP
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT="587"
# SMTP_USER="your-email@gmail.com"
# SMTP_PASS="your-app-password"

# SMS - Twilio (Optional)
TWILIO_ACCOUNT_SID="ACxxxxx"
TWILIO_AUTH_TOKEN="your-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Maps - Google Maps (Optional)
GOOGLE_MAPS_API_KEY="AIzaxxxxx"

# Admin Account (First-time setup)
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="ChangeThisSecurePassword123!"
```

---

## 🚀 **SETUP INSTRUCTIONS**

### **Step 1: Copy Environment File**
```bash
cp .env.example .env
```

### **Step 2: Configure Database**
1. Set up MongoDB cluster
2. Get connection string
3. Add to `DATABASE_URL` in `.env`

### **Step 3: Configure File Upload**
1. Set up Cloudinary account
2. Get credentials
3. Add to `.env` file

### **Step 4: Configure Payments**
1. Set up Stripe account
2. Get API keys
3. Add to `.env` file

### **Step 5: Configure Email**
1. Set up SendGrid account
2. Get API key
3. Add to `.env` file

### **Step 6: Configure Optional Services**
1. Set up Twilio for SMS (optional)
2. Set up Google Maps API (optional)
3. Add credentials to `.env`

### **Step 7: Generate Secure Secrets**
```bash
# Generate session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **Step 8: Test Configuration**
```bash
# Install dependencies
npm install

# Run database migration
npx prisma db push

# Start development server
npm run dev
```

---

## 🔧 **CONFIGURATION TIPS**

### **Development vs Production**
- **Development**: Use test API keys and sandbox environments
- **Production**: Use live API keys and production environments
- **Environment Variables**: Use different values for different environments

### **Security Best Practices**
- **Never commit `.env` files** to version control
- **Use strong, random secrets** for authentication
- **Rotate API keys** regularly
- **Monitor API usage** and costs
- **Use environment-specific configurations**

### **Cost Optimization**
- **Monitor API usage** to avoid unexpected charges
- **Use free tiers** when possible for development
- **Set up billing alerts** for paid services
- **Optimize API calls** to reduce costs

### **Troubleshooting**
- **Check API keys** are correct and active
- **Verify service status** if APIs are not working
- **Check rate limits** if you're hitting limits
- **Review logs** for error messages
- **Test in development** before deploying to production

---

## 📞 **SUPPORT**

### **API Service Support**
- **MongoDB**: [https://support.mongodb.com/](https://support.mongodb.com/)
- **Cloudinary**: [https://support.cloudinary.com/](https://support.cloudinary.com/)
- **Stripe**: [https://support.stripe.com/](https://support.stripe.com/)
- **SendGrid**: [https://support.sendgrid.com/](https://support.sendgrid.com/)
- **Twilio**: [https://support.twilio.com/](https://support.twilio.com/)

### **FindoTrip Support**
- **Email**: support@findotrip.com
- **Documentation**: [https://docs.findotrip.com/](https://docs.findotrip.com/)
- **GitHub**: [https://github.com/findotrip/support](https://github.com/findotrip/support)

---

## 🎯 **CONCLUSION**

This API integration guide covers all the necessary services and configurations to run the FindoTrip platform successfully. Follow the setup instructions carefully and test each service to ensure everything is working correctly.

**Remember:**
- Keep your API keys secure
- Monitor usage and costs
- Test in development before production
- Keep documentation updated
- Follow security best practices

**Happy Coding! 🚀**
