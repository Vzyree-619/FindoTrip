# 🔐 OAuth & Stripe Setup Guide

This guide will help you set up Google/Facebook OAuth login and Stripe payment processing. **You only need to add API keys to your `.env` file - everything else is already configured!**

---

## 📋 **Prerequisites**

1. A `.env` file in your project root (copy from `env.example` if needed)
2. Accounts with:
   - Google Cloud Console (for Google OAuth)
   - Facebook Developers (for Facebook OAuth)
   - Stripe (for payments)

---

## 🔵 **1. Google OAuth Setup**

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - Development: `http://localhost:5173/auth/google/callback`
   - Production: `https://yourdomain.com/auth/google/callback`
7. Copy the **Client ID** and **Client Secret**

### Step 2: Add to `.env` File

```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:5173/auth/google/callback"
```

**For production**, update `GOOGLE_CALLBACK_URL` to your production domain.

---

## 📘 **2. Facebook OAuth Setup**

### Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Choose **Consumer** app type
4. Fill in app details
5. Go to **Settings** → **Basic**
6. Add **App Domains** and **Site URL**
7. Go to **Products** → **Facebook Login** → **Settings**
8. Add Valid OAuth Redirect URIs:
   - Development: `http://localhost:5173/auth/facebook/callback`
   - Production: `https://yourdomain.com/auth/facebook/callback`
9. Copy **App ID** and **App Secret**

### Step 2: Add to `.env` File

```env
FACEBOOK_CLIENT_ID="your-app-id"
FACEBOOK_CLIENT_SECRET="your-app-secret"
FACEBOOK_CALLBACK_URL="http://localhost:5173/auth/facebook/callback"
```

**For production**, update `FACEBOOK_CALLBACK_URL` to your production domain.

---

## 💳 **3. Stripe Payment Setup**

### Step 1: Create Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Sign up or log in
3. Go to **Developers** → **API keys**
4. Copy your **Publishable key** and **Secret key**
   - Use **Test mode** keys for development
   - Use **Live mode** keys for production

### Step 2: Install Stripe Package

```bash
npm install stripe
```

### Step 3: Add to `.env` File

```env
STRIPE_SECRET_KEY="sk_test_..." # Test mode
STRIPE_PUBLISHABLE_KEY="pk_test_..." # Test mode
```

**For production**, use `sk_live_...` and `pk_live_...` keys.

---

## ✅ **4. Verify Setup**

### Check OAuth Login

1. Restart your development server
2. Go to `/login` or `/register`
3. You should see **Google** and **Facebook** buttons (enabled if keys are set)
4. Click a button to test OAuth flow

### Check Stripe Payment

1. Go through a booking flow
2. Select **Credit/Debit Card** payment method
3. Stripe payment form should appear if keys are configured

---

## 🔧 **Troubleshooting**

### OAuth Not Working?

- ✅ Check that callback URLs match exactly in provider settings
- ✅ Ensure `APP_URL` in `.env` matches your current domain
- ✅ Verify client ID and secret are correct
- ✅ Check browser console for errors

### Stripe Not Working?

- ✅ Ensure `stripe` package is installed: `npm install stripe`
- ✅ Verify `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` are set
- ✅ Check that keys match (test keys for test mode, live keys for live mode)
- ✅ Restart server after adding keys

### Buttons Still Disabled?

- ✅ Check `.env` file has the correct variable names
- ✅ Restart development server after adding keys
- ✅ Verify no typos in environment variable names

---

## 📝 **Complete `.env` Example**

```env
# Application
APP_URL="http://localhost:5173"
NODE_ENV="development"

# OAuth - Google
GOOGLE_CLIENT_ID="123456789-abc.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abc123"
GOOGLE_CALLBACK_URL="http://localhost:5173/auth/google/callback"

# OAuth - Facebook
FACEBOOK_CLIENT_ID="123456789012345"
FACEBOOK_CLIENT_SECRET="abc123def456"
FACEBOOK_CALLBACK_URL="http://localhost:5173/auth/facebook/callback"

# Payment - Stripe
STRIPE_SECRET_KEY="sk_test_51Abc123..."
STRIPE_PUBLISHABLE_KEY="pk_test_51Abc123..."
```

---

## 🚀 **That's It!**

Once you add the API keys to your `.env` file and restart the server:

- ✅ Google login will work automatically
- ✅ Facebook login will work automatically  
- ✅ Stripe payments will work automatically

All user data, sessions, and payment records are automatically stored in your database. No additional configuration needed!

