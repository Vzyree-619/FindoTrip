import { Authenticator } from "remix-auth";
import { OAuth2Strategy } from "remix-auth-oauth2";
import type { User } from "@prisma/client";
import { prisma } from "~/lib/db/db.server";
import { sessionStorage } from "~/lib/auth/auth.server";

// Create authenticator instance
export const authenticator = new Authenticator<User>(sessionStorage);

// ============================================================================
// Google OAuth Strategy
// ============================================================================

interface GoogleProfile {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

interface GoogleExtraParams {
  expires_in: number;
  token_type: string;
  scope: string;
  id_token: string;
}

const googleStrategy = new OAuth2Strategy<User, GoogleProfile, GoogleExtraParams>(
  {
    authorizationURL: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenURL: "https://oauth2.googleapis.com/token",
    clientID: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.APP_URL || "http://localhost:5173"}/auth/google/callback`,
    scope: "openid email profile",
  },
  async ({ accessToken, extraParams, profile }) => {
    // Fetch user profile from Google
    const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const googleProfile: GoogleProfile = await response.json();

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: googleProfile.email },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: googleProfile.email,
          name: googleProfile.name,
          avatar: googleProfile.picture,
          password: "", // OAuth users don't need password
          role: "CUSTOMER",
          verified: googleProfile.verified_email,
        },
      });
    } else if (!user.avatar && googleProfile.picture) {
      // Update avatar if user exists but doesn't have one
      user = await prisma.user.update({
        where: { id: user.id },
        data: { avatar: googleProfile.picture },
      });
    }

    return user;
  }
);

// ============================================================================
// Facebook OAuth Strategy
// ============================================================================

interface FacebookProfile {
  id: string;
  email: string;
  name: string;
  first_name: string;
  last_name: string;
  picture: {
    data: {
      url: string;
      is_silhouette: boolean;
    };
  };
}

interface FacebookExtraParams {
  expires_in: number;
  token_type: string;
}

const facebookStrategy = new OAuth2Strategy<User, FacebookProfile, FacebookExtraParams>(
  {
    authorizationURL: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenURL: "https://graph.facebook.com/v18.0/oauth/access_token",
    clientID: process.env.FACEBOOK_CLIENT_ID || "",
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || `${process.env.APP_URL || "http://localhost:5173"}/auth/facebook/callback`,
    scope: "email public_profile",
  },
  async ({ accessToken }) => {
    // Fetch user profile from Facebook
    const response = await fetch(
      `https://graph.facebook.com/me?fields=id,email,name,first_name,last_name,picture.type(large)&access_token=${accessToken}`
    );

    const facebookProfile: FacebookProfile = await response.json();

    if (!facebookProfile.email) {
      throw new Error("Email not provided by Facebook. Please grant email permission.");
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: facebookProfile.email },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: facebookProfile.email,
          name: facebookProfile.name,
          avatar: facebookProfile.picture.data.url,
          password: "", // OAuth users don't need password
          role: "CUSTOMER",
          verified: true,
        },
      });
    } else if (!user.avatar && !facebookProfile.picture.data.is_silhouette) {
      // Update avatar if user exists but doesn't have one
      user = await prisma.user.update({
        where: { id: user.id },
        data: { avatar: facebookProfile.picture.data.url },
      });
    }

    return user;
  }
);

// Register strategies
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  authenticator.use(googleStrategy, "google");
}

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  authenticator.use(facebookStrategy, "facebook");
}
