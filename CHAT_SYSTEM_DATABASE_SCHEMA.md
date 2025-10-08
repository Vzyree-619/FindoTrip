# Comprehensive Chat System Database Schema

## 🎯 Overview

This document outlines the complete database schema for the FindoTrip chat system, designed to support real-time messaging, analytics, and comprehensive communication tracking across the platform.

## 📊 Core Chat Models

### 1. **Conversation Model**
```prisma
model Conversation {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Participants
  participants    String[] @db.ObjectId // Array of user IDs in conversation
  participantRoles String[] // Array of roles corresponding to participants
  
  // Conversation metadata
  type            ConversationType
  title           String? // Optional conversation title
  description     String? // Optional conversation description
  
  // Related entities
  relatedBookingId String? @db.ObjectId
  relatedBookingType String? // "property", "vehicle", "tour"
  relatedServiceId String? @db.ObjectId
  relatedServiceType String? // "property", "vehicle", "tour"
  
  // Conversation state
  isActive        Boolean @default(true)
  isArchived      Boolean @default(false)
  isPinned        Boolean @default(false)
  
  // Message tracking
  lastMessageId   String? @db.ObjectId
  lastMessage     Message? @relation("ConversationLastMessage", fields: [lastMessageId], references: [id])
  lastMessageAt   DateTime @default(now())
  messageCount    Int @default(0)
  
  // Unread tracking
  unreadCount     Json // {userId: count} for each participant
  lastReadAt      Json // {userId: timestamp} for each participant
  
  // Analytics
  responseTime    Int? // Average response time in minutes
  customerSatisfaction Float?
  qualityScore    Float?
  
  // Relationships
  messages        Message[] @relation("ConversationMessages")
  notifications   ChatNotification[]
  propertyBookings PropertyBooking[] @relation("PropertyBookingConversation")
  vehicleBookings VehicleBooking[] @relation("VehicleBookingConversation")
  tourBookings TourBooking[] @relation("TourBookingConversation")
}
```

### 2. **Message Model**
```prisma
model Message {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Message content
  content         String
  type            MessageType @default(TEXT)
  
  // Sender information
  senderId        String   @db.ObjectId
  sender          User     @relation("MessageSender", fields: [senderId], references: [id], onDelete: Cascade)
  senderRole      UserRole
  
  // Conversation
  conversationId  String   @db.ObjectId
  conversation    Conversation @relation("ConversationMessages", fields: [conversationId], references: [id], onDelete: Cascade)
  
  // Message threading
  replyToId       String? @db.ObjectId
  replyTo         Message? @relation("MessageReply", fields: [replyToId], references: [id])
  replies         Message[] @relation("MessageReply")
  
  // Attachments
  attachments     Json[] // Array of {url, name, type, size}
  
  // Read status
  isRead          Boolean @default(false)
  readBy          String[] @db.ObjectId // Array of user IDs who read it
  readAt          Json // {userId: timestamp}
  
  // Edit tracking
  isEdited        Boolean @default(false)
  editedAt        DateTime?
  editHistory     Json[] // Array of {content, editedAt}
  
  // Message metadata
  isDeleted       Boolean @default(false)
  deletedAt       DateTime?
  deletedBy       String? @db.ObjectId
  
  // AI analysis
  sentimentScore  Float?
  professionalTone Float?
  qualityScore    Float?
  language        String?
  
  // System data
  systemData      Json?
  
  // Relationships
  notifications   ChatNotification[]
}
```

### 3. **ChatNotification Model**
```prisma
model ChatNotification {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  createdAt       DateTime @default(now())
  
  // Recipient
  userId          String   @db.ObjectId
  user            User     @relation("ChatNotificationUser", fields: [userId], references: [id], onDelete: Cascade)
  
  // Related entities
  conversationId  String   @db.ObjectId
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  messageId       String   @db.ObjectId
  message         Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  
  // Notification content
  title           String
  body            String
  type            String @default("message") // "message", "mention", "system"
  
  // Read status
  isRead          Boolean @default(false)
  readAt          DateTime?
  
  // Delivery status
  isDelivered     Boolean @default(false)
  deliveredAt     DateTime?
  
  // Notification metadata
  priority        String @default("normal") // "low", "normal", "high", "urgent"
  category        String? // "booking", "support", "general"
}
```

## 🔧 Enums and Types

### **ConversationType**
```prisma
enum ConversationType {
  CUSTOMER_PROVIDER
  PROVIDER_ADMIN
  CUSTOMER_ADMIN
  GROUP_CHAT
  SUPPORT_TICKET
}
```

### **MessageType**
```prisma
enum MessageType {
  TEXT
  IMAGE
  FILE
  SYSTEM
  NOTIFICATION
  REPLY
}
```

### **Additional Enums**
```prisma
enum ChatStatus {
  ACTIVE
  INACTIVE
  ARCHIVED
  BLOCKED
}

enum NotificationPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum MessageStatus {
  SENT
  DELIVERED
  READ
  FAILED
}
```

## 📈 Analytics Models

### **ChatAnalytics Model**
```prisma
model ChatAnalytics {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  
  // Time period
  date            DateTime @default(now())
  period          String @default("daily") // "hourly", "daily", "weekly", "monthly"
  
  // Conversation metrics
  totalConversations Int @default(0)
  activeConversations Int @default(0)
  newConversations Int @default(0)
  closedConversations Int @default(0)
  
  // Message metrics
  totalMessages   Int @default(0)
  messagesSent    Int @default(0)
  messagesReceived Int @default(0)
  averageMessagesPerConversation Float @default(0)
  
  // Response time metrics
  averageResponseTime Int @default(0) // in minutes
  firstResponseTime Int @default(0) // in minutes
  responseRate    Float @default(0) // percentage
  
  // User engagement
  activeUsers     Int @default(0)
  newUsers        Int @default(0)
  returningUsers  Int @default(0)
  
  // Quality metrics
  averageQualityScore Float @default(0)
  flaggedMessages Int @default(0)
  deletedMessages Int @default(0)
  
  // Platform-specific metrics
  platformId      String? @db.ObjectId
  serviceType     String? // "property", "vehicle", "tour"
}
```

### **ChatInsight Model**
```prisma
model ChatInsight {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  createdAt       DateTime @default(now())
  
  // Insight metadata
  type            String // "improvement", "achievement", "trend", "recommendation", "warning"
  priority        String // "low", "medium", "high", "critical"
  category        String // "response_time", "conversion", "quality", "engagement"
  
  // Target
  targetType      String // "provider", "customer", "admin", "platform"
  targetId        String? @db.ObjectId
  
  // Insight content
  title           String
  description     String
  action          String
  impact          String
  
  // Data
  data            Json?
  metrics         Json?
  
  // Status
  isRead          Boolean @default(false)
  isActioned      Boolean @default(false)
  actionedAt      DateTime?
  actionedBy      String? @db.ObjectId
  
  // Expiry
  expiresAt       DateTime?
  isExpired       Boolean @default(false)
}
```

## 🔗 Relationships and Integration

### **User Model Updates**
```prisma
model User {
  // ... existing fields ...
  
  // ========================================
  // COMPREHENSIVE CHAT SYSTEM RELATIONSHIPS
  // ========================================
  
  // Messages sent
  messagesSent Message[] @relation("MessageSender")
  
  // Chat notifications received
  chatNotifications ChatNotification[] @relation("ChatNotificationUser")
  
  // Chat insights targeted to this user
  chatInsights ChatInsight[] @relation("ChatInsightTarget")
  
  // Quick access fields
  hasUnreadMessages Boolean @default(false)
  lastActiveAt DateTime?
}
```

### **Booking Model Integration**
```prisma
// PropertyBooking
model PropertyBooking {
  // ... existing fields ...
  
  // Chat integration
  conversationId String? @db.ObjectId
  conversation Conversation? @relation("PropertyBookingConversation", fields: [conversationId], references: [id])
}

// VehicleBooking
model VehicleBooking {
  // ... existing fields ...
  
  // Chat integration
  conversationId String? @db.ObjectId
  conversation Conversation? @relation("VehicleBookingConversation", fields: [conversationId], references: [id])
}

// TourBooking
model TourBooking {
  // ... existing fields ...
  
  // Chat integration
  conversationId String? @db.ObjectId
  conversation Conversation? @relation("TourBookingConversation", fields: [conversationId], references: [id])
}
```

## 🚀 Performance Indexes

### **Conversation Indexes**
```prisma
@@index([participants])
@@index([type])
@@index([isActive])
@@index([lastMessageAt])
@@index([relatedBookingId])
@@index([relatedServiceId])
@@index([participants, lastMessageAt])
@@index([participants, isActive])
```

### **Message Indexes**
```prisma
@@index([conversationId])
@@index([senderId])
@@index([createdAt])
@@index([isRead])
@@index([conversationId, createdAt])
@@index([senderId, createdAt])
@@index([type])
@@index([isDeleted])
```

### **ChatNotification Indexes**
```prisma
@@index([userId])
@@index([isRead])
@@index([conversationId])
@@index([createdAt])
@@index([userId, isRead])
@@index([userId, createdAt])
```

### **Analytics Indexes**
```prisma
@@index([date])
@@index([period])
@@index([platformId])
@@index([serviceType])
@@index([date, period])
```

## 🎯 Key Features

### **1. Real-Time Messaging**
- **Multi-participant conversations** with role tracking
- **Message threading** for organized discussions
- **Read receipts** and delivery status
- **Message editing** with history tracking
- **File attachments** with metadata

### **2. Advanced Analytics**
- **Response time tracking** for performance metrics
- **Quality scoring** with AI analysis
- **Engagement metrics** for user behavior
- **Conversation analytics** for insights

### **3. Notification System**
- **Real-time notifications** for new messages
- **Priority-based delivery** (low, normal, high, urgent)
- **Category-based organization** (booking, support, general)
- **Read status tracking** with timestamps

### **4. Integration Features**
- **Booking integration** linking conversations to bookings
- **Service linking** connecting chats to properties/vehicles/tours
- **User activity tracking** with last active timestamps
- **Unread message counting** for quick access

### **5. AI-Powered Insights**
- **Sentiment analysis** for message content
- **Professional tone scoring** for quality assessment
- **Language detection** for international support
- **Automated insights** for performance improvement

## 📱 Communication Badge System

### **Badge Components**
- **CommunicationBadge**: Displays score-based badges
- **CommunicationScore**: Shows score with trends
- **ProviderCommunicationCard**: Provider performance cards

### **Badge Criteria**
- **90-100**: "Excellent Communication" (gold badge)
- **80-89**: "Great Communication" (silver badge)
- **70-79**: "Good Communication" (bronze badge)
- **< 70**: No badge, suggestions to improve

## 🔧 Technical Implementation

### **Database Design Principles**
1. **Scalability**: Optimized for high-volume messaging
2. **Performance**: Comprehensive indexing for real-time queries
3. **Flexibility**: Support for multiple conversation types
4. **Analytics**: Built-in metrics and insights
5. **Integration**: Seamless booking and service linking

### **Real-Time Features**
- **WebSocket support** for live messaging
- **Push notifications** for mobile devices
- **Live typing indicators** for active conversations
- **Real-time read receipts** for message status

### **Security Features**
- **Role-based access** control for conversations
- **Message encryption** for sensitive data
- **Audit logging** for compliance
- **Data retention** policies for privacy

## 📊 Analytics Capabilities

### **Provider Analytics**
- **Response time metrics** with trends
- **Message quality scoring** with AI analysis
- **Customer satisfaction** tracking
- **Conversion rate** from chat to booking

### **Platform Analytics**
- **System-wide metrics** for admin insights
- **User engagement** patterns
- **Performance benchmarking** across providers
- **Quality monitoring** with automated alerts

### **Customer Analytics**
- **Provider comparison** tools
- **Response time insights** for selection
- **Conversation history** tracking
- **Booking integration** analytics

## 🎉 Benefits

### **For Providers**
- **Performance visibility** with clear metrics
- **Improvement guidance** through AI insights
- **Badge system** for recognition and motivation
- **Real-time feedback** for better communication

### **For Customers**
- **Provider selection** based on communication quality
- **Response time transparency** for expectations
- **Seamless booking integration** with chat history
- **Quality assurance** through performance tracking

### **For Platform**
- **Quality control** through automated monitoring
- **Performance optimization** with data-driven insights
- **User engagement** through gamification
- **Revenue growth** through improved conversions

---

## 🚀 Implementation Status

### ✅ **Completed Features**
- [x] Core chat models (Conversation, Message, ChatNotification)
- [x] Analytics models (ChatAnalytics, ChatInsight)
- [x] User model integration with chat relationships
- [x] Booking model integration with conversation linking
- [x] Comprehensive indexing for performance
- [x] Communication badge system
- [x] AI-powered insights system
- [x] Real-time notification support

### 🔄 **Next Steps**
- [ ] Conversation quality analysis implementation
- [ ] Export and reporting system
- [ ] Predictive analytics system
- [ ] Benchmarking system
- [ ] Gamification features
- [ ] Badge integration in provider profiles

The chat system database schema is now complete and ready for implementation, providing a comprehensive foundation for real-time messaging, analytics, and communication quality tracking across the FindoTrip platform.
