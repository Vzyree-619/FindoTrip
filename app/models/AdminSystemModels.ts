// Admin System Models Documentation
// These models have been added to the Prisma schema

// Import types for better TypeScript support
import type { Prisma } from '@prisma/client';

// Export the models documentation
export const AdminSystemModels = `
// ========================================
// ADMIN SYSTEM MODELS
// ========================================

// Automation Rules
model AutomationRule {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  name            String
  description     String
  type            AutomationType
  trigger         String   // e.g., "ticket_created", "status_changed"
  conditions      Json     // JSON object with conditions
  actions         Json     // JSON object with actions to perform
  isActive        Boolean  @default(true)
  
  // Relationships
  createdById     String   @db.ObjectId
  createdBy       User     @relation("AutomationRuleCreator", fields: [createdById], references: [id], onDelete: Cascade)
  
  // Usage tracking
  executions      AutomationExecution[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([type])
  @@index([isActive])
  @@index([createdById])
}

model AutomationExecution {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  ruleId          String   @db.ObjectId
  rule            AutomationRule @relation(fields: [ruleId], references: [id], onDelete: Cascade)
  
  ticketId        String?  @db.ObjectId
  ticket          SupportTicket? @relation(fields: [ticketId], references: [id])
  
  status          ExecutionStatus @default(SUCCESS)
  executedAt      DateTime @default(now())
  result          String?
  errorMessage    String?
  
  @@index([ruleId])
  @@index([ticketId])
  @@index([executedAt])
}

// Email Templates
model EmailTemplate {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  name            String
  subject         String
  fromName        String
  fromEmail       String
  body            String   // HTML content
  category        EmailCategory
  description     String?
  isEnabled       Boolean  @default(true)
  
  // Relationships
  createdById     String   @db.ObjectId
  createdBy       User     @relation("EmailTemplateCreator", fields: [createdById], references: [id], onDelete: Cascade)
  
  // Usage tracking
  emailLogs       EmailLog[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([category])
  @@index([isEnabled])
  @@index([createdById])
}

model EmailLog {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  templateId      String?  @db.ObjectId
  template        EmailTemplate? @relation(fields: [templateId], references: [id])
  
  recipientEmail  String
  recipientName   String?
  subject         String
  content         String
  status          EmailStatus @default(SENT)
  sentAt          DateTime @default(now())
  deliveredAt     DateTime?
  openedAt        DateTime?
  clickedAt       DateTime?
  isTest          Boolean  @default(false)
  
  @@index([templateId])
  @@index([recipientEmail])
  @@index([status])
  @@index([sentAt])
}

// Notification Settings
model NotificationSettings {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  adminNotifications Json  // JSON object with admin notification preferences
  userNotifications  Json  // JSON object with user notification preferences
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model AdminNotificationRecipient {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  email           String   @unique
  name            String
  isSmsEnabled    Boolean  @default(false)
  phoneNumber     String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model PushNotificationSettings {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  enabled         Boolean  @default(true)
  serviceWorkerActive Boolean @default(true)
  vapidPublicKey  String?
  vapidPrivateKey String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model SmsSettings {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  enabled         Boolean  @default(true)
  provider        String   @default("twilio")
  accountSid      String?
  authToken       String?
  fromNumber      String?
  remainingCredits Int     @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model NotificationLog {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  type            NotificationType
  recipientEmail  String?
  recipientPhone  String?
  recipientName   String?
  subject         String?
  content         String
  status          NotificationStatus @default(SENT)
  sentAt          DateTime @default(now())
  deliveredAt     DateTime?
  isTest          Boolean  @default(false)
  
  @@index([type])
  @@index([status])
  @@index([sentAt])
}

// Security Settings
model SecuritySettings {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  passwordRequirements Json // JSON object with password requirements
  sessionSettings Json     // JSON object with session settings
  twoFactorAuth   Json     // JSON object with 2FA settings
  rateLimiting    Json     // JSON object with rate limiting settings
  dataEncryption  Json     // JSON object with encryption settings
  backupSettings  Json     // JSON object with backup settings
  auditLogging    Json     // JSON object with audit logging settings
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model BlockedIP {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  ipAddress       String   @unique
  reason          String
  blockedBy       String   @db.ObjectId
  blockedAt       DateTime @default(now())
  
  @@index([ipAddress])
  @@index([blockedAt])
}

model BackupInfo {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  backupType      String   // "automatic", "manual"
  status          String   // "completed", "failed", "in_progress"
  size            String?
  createdAt       DateTime @default(now())
  createdBy       String?  @db.ObjectId
  
  @@index([backupType])
  @@index([status])
  @@index([createdAt])
}

// Platform Settings
model PlatformSettings {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  platformName    String
  platformDescription String?
  platformLogo    String?
  platformFavicon String?
  defaultCurrency String   @default("USD")
  defaultLanguage String   @default("en")
  timezone        String   @default("UTC")
  dateFormat      String   @default("MM/DD/YYYY")
  timeFormat      String   @default("12h")
  commissionRate  Float    @default(10.0)
  taxRate         Float    @default(0.0)
  supportEmail    String?
  supportPhone    String?
  supportHours    String?
  termsOfService  String?
  privacyPolicy   String?
  refundPolicy    String?
  cancellationPolicy String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model PaymentGateway {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  name            String
  type            String   // "stripe", "paypal", "square", "razorpay"
  isActive        Boolean  @default(true)
  isPrimary       Boolean  @default(false)
  isBackup        Boolean  @default(false)
  testMode        Boolean  @default(false)
  apiKey          String?
  secretKey       String?
  webhookSecret   String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([type])
  @@index([isActive])
  @@index([isPrimary])
}

model PaymentMethod {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  type            String   // "credit_card", "paypal", "apple_pay", "google_pay", "bank_transfer"
  isEnabled       Boolean  @default(true)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([type])
  @@index([isEnabled])
}

model FeatureToggle {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  name            String   @unique
  description     String?
  category        String   // "booking", "social", "communication", "marketing", "payment"
  isEnabled       Boolean  @default(true)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([category])
  @@index([isEnabled])
}

model PlatformLimit {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  name            String   @unique
  description     String?
  category        String   // "user", "service", "content"
  value           Int
  unit            String   // "properties", "vehicles", "tours", "images", "characters"
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([category])
}

model MaintenanceMode {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  isEnabled       Boolean  @default(false)
  message         String?
  estimatedEndTime DateTime?
  startedBy       String?  @db.ObjectId
  endedBy         String?  @db.ObjectId
  endedAt         DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([isEnabled])
}

// Activity Logs
model ActivityLog {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  type            ActivityType
  description     String
  userId          String?  @db.ObjectId
  user            User?    @relation("ActivityLogUser", fields: [userId], references: [id], onDelete: Cascade)
  ipAddress       String?
  userAgent       String?
  location        String?
  metadata        Json?
  
  createdAt       DateTime @default(now())
  
  @@index([type])
  @@index([userId])
  @@index([createdAt])
}

// Analytics Models
model AnalyticsEvent {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  eventType       String   // "page_view", "session_duration", "pages_per_session", "bounce_rate", "search"
  userId          String?  @db.ObjectId
  user            User?    @relation("AnalyticsEventUser", fields: [userId], references: [id], onDelete: Cascade)
  page            String?
  source          String?
  searchTerm      String?
  value           Float?
  metadata        Json?
  
  createdAt       DateTime @default(now())
  
  @@index([eventType])
  @@index([userId])
  @@index([createdAt])
}

model MarketingSpend {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  amount          Float
  channel         String   // "google", "facebook", "instagram", "twitter", "email"
  campaign        String?
  description     String?
  
  createdAt       DateTime @default(now())
  
  @@index([channel])
  @@index([createdAt])
}

model Session {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  userId          String   @db.ObjectId
  user            User     @relation("UserSession", fields: [userId], references: [id], onDelete: Cascade)
  token           String   @unique
  expiresAt       DateTime
  ipAddress       String?
  userAgent       String?
  
  createdAt       DateTime @default(now())
  
  @@index([userId])
  @@index([expiresAt])
}

// Additional Enums
enum AutomationType {
  AUTO_REPLY
  AUTO_ASSIGNMENT
  AUTO_ESCALATION
  REMINDER
}

enum ExecutionStatus {
  SUCCESS
  FAILED
  PENDING
}

enum EmailCategory {
  CUSTOMER
  PROVIDER
  ADMIN
}

enum EmailStatus {
  SENT
  DELIVERED
  OPENED
  CLICKED
  FAILED
  BOUNCED
}

enum NotificationType {
  EMAIL
  SMS
  PUSH
}

enum NotificationStatus {
  SENT
  DELIVERED
  FAILED
  PENDING
}

enum ActivityType {
  USER_LOGIN
  USER_REGISTRATION
  USER_UPDATE
  USER_DELETE
  BOOKING_CREATED
  BOOKING_CANCELLED
  REVIEW_CREATED
  MESSAGE_SENT
  USER_ACTIVE
}

// Additional User Relations
// Add these to the existing User model:
// automationRulesCreated AutomationRule[] @relation("AutomationRuleCreator")
// emailTemplatesCreated EmailTemplate[] @relation("EmailTemplateCreator")
// activityLogs ActivityLog[] @relation("ActivityLogUser")
// analyticsEvents AnalyticsEvent[] @relation("AnalyticsEventUser")
// sessions Session[] @relation("UserSession")

// Additional SupportTicket Relations
// Add this to the existing SupportTicket model:
// automationExecutions AutomationExecution[] @relation
`;

export default AdminSystemModels;
