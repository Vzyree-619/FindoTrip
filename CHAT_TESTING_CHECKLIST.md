# FindoTrip Chat System - Comprehensive Testing Checklist

## Testing Instructions
- Test scenarios in order (don't skip!)
- Check each box when test passes ✅
- Document failures with screenshots and error messages
- Fix issues before proceeding to next test
- Re-test after fixes until ALL tests pass

---

## 1. Customer → Provider Chat Flow Tests

### Test Scenario A - Property Inquiry
- [ ] Customer browses property detail page
- [ ] Clicks "Message Host" button  
- [ ] ✅ Chat modal/page opens
- [ ] ✅ Conversation created in database with type='CUSTOMER_PROVIDER'
- [ ] ✅ Property context displayed in chat header
- [ ] Customer sends: "Is parking available?"
- [ ] ✅ Message saved to database
- [ ] ✅ Property owner receives in-app notification
- [ ] ✅ Property owner sees unread badge update
- [ ] ✅ Email sent to property owner (if offline)
- [ ] Property owner responds: "Yes, free parking included"
- [ ] ✅ Customer receives real-time message update
- [ ] ✅ Customer notification created
- [ ] ✅ Read receipts update when customer reads

**Issues Found:**
```
Issue #A1: 
Expected: 
Actual: 
Code Location: 
Console Error: 
```

### Test Scenario B - Vehicle Rental
- [ ] Customer searches vehicles, finds one
- [ ] Clicks "Contact Owner" on vehicle card
- [ ] ✅ Chat opens with vehicle context
- [ ] Customer asks about insurance
- [ ] Vehicle owner responds with details
- [ ] ✅ Both see typing indicators
- [ ] ✅ Online status shows correctly
- [ ] Customer books vehicle
- [ ] ✅ Booking linked to existing conversation
- [ ] ✅ System message added: "Booking #123 confirmed"

**Issues Found:**
```
Issue #B1: 
Expected: 
Actual: 
Code Location: 
Console Error: 
```

### Test Scenario C - Tour Questions
- [ ] Customer viewing tour detail page
- [ ] Clicks "Message Guide"
- [ ] Sends question about difficulty level
- [ ] Tour guide responds
- [ ] Customer books tour
- [ ] ✅ Conversation persists with booking context
- [ ] ✅ Both can continue chatting about meeting point

**Issues Found:**
```
Issue #C1: 
Expected: 
Actual: 
Code Location: 
Console Error: 
```

---

## 2. Provider → Admin Support Chat Tests

### Test Scenario D - Property Owner Needs Help
- [ ] Property owner clicks "Contact Support" button
- [ ] Selects category: "Approval Question"
- [ ] Sends: "My property has been pending for 3 days"
- [ ] ✅ Support ticket created in database
- [ ] ✅ Admin sees new ticket in support dashboard
- [ ] ✅ Admin receives email notification
- [ ] ✅ Ticket shows property owner info and related property
- [ ] Admin responds with approval update
- [ ] ✅ Property owner receives notification
- [ ] ✅ Property owner sees response in real-time
- [ ] Admin marks ticket as "Resolved"
- [ ] ✅ Status updates in database
- [ ] Property owner rates support experience
- [ ] ✅ Rating saved and shown in admin analytics

**Issues Found:**
```
Issue #D1: 
Expected: 
Actual: 
Code Location: 
Console Error: 
```

### Test Scenario E - Vehicle Owner Document Issue
- [ ] Vehicle owner submits vehicle for approval
- [ ] Admin reviews and finds insurance document expired
- [ ] Admin messages owner in approval chat: "Insurance expired"
- [ ] ✅ Message sent through approval conversation
- [ ] Vehicle owner uploads new document IN CHAT
- [ ] ✅ File upload works, URL saved
- [ ] Admin views document from chat
- [ ] Admin approves vehicle
- [ ] ✅ Approval status updates
- [ ] ✅ Vehicle becomes searchable
- [ ] ✅ Conversation remains accessible for reference

**Issues Found:**
```
Issue #E1: 
Expected: 
Actual: 
Code Location: 
Console Error: 
```

### Test Scenario F - Tour Guide Escalation
- [ ] Tour guide has payment issue
- [ ] Creates support ticket, no admin response in 24h
- [ ] ✅ Auto-escalation triggers
- [ ] ✅ Senior admin receives urgent notification
- [ ] ✅ Ticket priority marked as "Urgent"
- [ ] Admin resolves issue
- [ ] ✅ Resolution logged

**Issues Found:**
```
Issue #F1: 
Expected: 
Actual: 
Code Location: 
Console Error: 
```

---

## 3. Multi-User Conversation Tests

### Test Scenario G - Customer has Multiple Chats
- [ ] Customer chats with 3 different property owners
- [ ] Customer chats with 1 vehicle owner
- [ ] Customer has 1 admin support conversation
- [ ] ✅ All 5 conversations shown in customer chat list
- [ ] ✅ Each conversation shows correct participant
- [ ] ✅ Last message preview shows correctly
- [ ] ✅ Unread counts accurate for each conversation
- [ ] ✅ Sorting by most recent works
- [ ] Customer searches for "parking"
- [ ] ✅ Search finds messages across all conversations
- [ ] Customer opens 2nd property owner chat
- [ ] ✅ Loads correct conversation with history
- [ ] ✅ Other property owner chats remain active

**Issues Found:**
```
Issue #G1: 
Expected: 
Actual: 
Code Location: 
Console Error: 
```

---

## 4. Real-Time Update Tests

### Test Scenario H - Two Users Online
- [ ] Open two browsers: Customer and Property Owner
- [ ] Customer sends message
- [ ] ✅ Property owner receives immediately (< 2 seconds)
- [ ] ✅ No page refresh needed
- [ ] Property owner types reply
- [ ] ✅ Customer sees "typing..." indicator
- [ ] Property owner sends message
- [ ] ✅ Customer receives immediately
- [ ] ✅ Read receipt updates in real-time
- [ ] Close customer browser
- [ ] ✅ Property owner sees "offline" status
- [ ] Reopen customer browser
- [ ] ✅ Property owner sees "online" status

**Issues Found:**
```
Issue #H1: 
Expected: 
Actual: 
Code Location: 
Console Error: 
```

---

## 5. Notification Tests

### Test Scenario I - Notification Cascade
- [ ] Property owner offline (lastSeen > 30 min)
- [ ] Customer sends message
- [ ] Wait 5 minutes
- [ ] ✅ Email sent to property owner
- [ ] ✅ In-app notification created
- [ ] Property owner logs in
- [ ] ✅ Unread badge shows on chat icon
- [ ] ✅ Notification appears in notification center
- [ ] Property owner clicks notification
- [ ] ✅ Opens correct conversation
- [ ] ✅ Notification marked as read
- [ ] ✅ Unread badge updates

**Issues Found:**
```
Issue #I1: 
Expected: 
Actual: 
Code Location: 
Console Error: 
```

---

## 6. Booking-Chat Integration Tests

### Test Scenario J - End-to-End Flow
- [ ] Customer searches for property
- [ ] Messages host with questions
- [ ] Host responds positively
- [ ] Customer books property
- [ ] ✅ Booking created and linked to conversation
- [ ] ✅ System message in chat: "Booking confirmed"
- [ ] ✅ Both users can continue chatting
- [ ] Customer asks about check-in time
- [ ] Host responds in same conversation
- [ ] Customer checks in (date passes)
- [ ] ✅ Review request shows in customer dashboard
- [ ] Customer writes review mentioning "great communication"
- [ ] ✅ Review linked to booking
- [ ] ✅ Host can see review
- [ ] ✅ Host can respond to review (optional feature)

**Issues Found:**
```
Issue #J1: 
Expected: 
Actual: 
Code Location: 
Console Error: 
```

---

## 7. Admin Approval-Chat Integration Tests

### Test Scenario K - Approval with Communication
- [ ] New vehicle owner registers
- [ ] Submits vehicle with documents
- [ ] ✅ Auto-creates approval request
- [ ] ✅ Auto-creates admin conversation
- [ ] Admin reviews, has questions about insurance
- [ ] Admin messages owner: "Please provide commercial insurance"
- [ ] ✅ Owner receives notification
- [ ] Owner uploads correct document in chat
- [ ] Admin reviews new document
- [ ] Admin approves with message: "Approved! Welcome to the platform"
- [ ] ✅ VehicleOwner.isVerified = true
- [ ] ✅ Vehicle.isActive = true
- [ ] ✅ Vehicle appears in search
- [ ] ✅ Owner can access all features
- [ ] ✅ Chat conversation preserved with approval trail

**Issues Found:**
```
Issue #K1: 
Expected: 
Actual: 
Code Location: 
Console Error: 
```

---

## 8. Error Handling Tests

### Test Scenario L - Connection Issues
- [ ] Customer sending message
- [ ] Disconnect internet mid-send
- [ ] ✅ Shows "sending failed" indicator
- [ ] ✅ Message queued locally
- [ ] Reconnect internet
- [ ] ✅ Message resends automatically
- [ ] ✅ Duplicate messages prevented

**Issues Found:**
```
Issue #L1: 
Expected: 
Actual: 
Code Location: 
Console Error: 
```

### Test Scenario M - Invalid Actions
- [ ] Try to message deleted user
- [ ] ✅ Error message shown
- [ ] Try to send empty message
- [ ] ✅ Send button disabled
- [ ] Try to upload 20MB file
- [ ] ✅ File size error shown
- [ ] Try to access conversation user is not participant in
- [ ] ✅ 403 Forbidden error
- [ ] Try to edit someone else's message
- [ ] ✅ Edit blocked with error

**Issues Found:**
```
Issue #M1: 
Expected: 
Actual: 
Code Location: 
Console Error: 
```

---

## 9. Performance Tests

### Test Scenario N - Heavy Load
- [ ] Create conversation with 1000+ messages
- [ ] Open conversation
- [ ] ✅ Initial load shows last 50 messages (< 2 seconds)
- [ ] Scroll up
- [ ] ✅ Lazy loads older messages smoothly
- [ ] Send new message
- [ ] ✅ Appears immediately
- [ ] Open 10 conversations simultaneously
- [ ] ✅ All load without lag
- [ ] Receive 5 messages in different conversations
- [ ] ✅ All update in real-time without performance hit

**Issues Found:**
```
Issue #N1: 
Expected: 
Actual: 
Code Location: 
Console Error: 
```

---

## 10. Cross-Role Permission Tests

### Test Scenario O - Permission Boundaries
- [ ] Customer tries to message another customer directly
- [ ] ✅ Blocked (no direct customer-customer chat)
- [ ] Property owner tries to message vehicle owner
- [ ] ✅ Blocked (providers only chat with customers/admin)
- [ ] Customer tries to message admin directly
- [ ] ✅ Allowed (customer support)
- [ ] Admin tries to message any user
- [ ] ✅ Allowed (admin can message anyone)
- [ ] Deleted user's messages
- [ ] ✅ Show as "[Deleted User]" but preserve message content

**Issues Found:**
```
Issue #O1: 
Expected: 
Actual: 
Code Location: 
Console Error: 
```

---

## 11. Database Consistency Tests

### After All Tests - Verify Database
- [ ] All conversations have correct participant arrays
- [ ] All messages linked to valid conversations
- [ ] All unread counts match actual unread messages
- [ ] All notifications linked to existing messages
- [ ] No orphaned records
- [ ] All timestamps in correct timezone
- [ ] All file URLs accessible
- [ ] All relations properly set

**Database Query Results:**
```sql
-- Run these queries and paste results:

-- Check conversation integrity
SELECT COUNT(*) as total_conversations FROM Conversation;
SELECT COUNT(*) as conversations_with_participants FROM Conversation WHERE array_length(participants, 1) >= 2;

-- Check message integrity  
SELECT COUNT(*) as total_messages FROM Message;
SELECT COUNT(*) as messages_with_valid_conversation FROM Message m 
JOIN Conversation c ON m.conversationId = c.id;

-- Check notification integrity
SELECT COUNT(*) as total_notifications FROM Notification WHERE type = 'MESSAGE_RECEIVED';
SELECT COUNT(*) as notifications_with_valid_user FROM Notification n 
JOIN User u ON n.userId = u.id WHERE n.type = 'MESSAGE_RECEIVED';

-- Check orphaned records
SELECT COUNT(*) as orphaned_messages FROM Message m 
LEFT JOIN Conversation c ON m.conversationId = c.id WHERE c.id IS NULL;
```

**Issues Found:**
```
Issue #DB1: 
Query: 
Expected Count: 
Actual Count: 
Fix Required: 
```

---

## 12. Admin Debugging Tools

### Required Admin Interface Features
- [ ] View any conversation (admin only)
- [ ] See message delivery status
- [ ] Check notification logs
- [ ] View WebSocket/SSE connection status
- [ ] Monitor real-time chat activity
- [ ] Export conversation for support
- [ ] Check user online status history

**Admin Tools Status:**
```
Tool #1 - Conversation Viewer: [ ] Implemented [ ] Tested [ ] Working
Tool #2 - Delivery Status: [ ] Implemented [ ] Tested [ ] Working
Tool #3 - Notification Logs: [ ] Implemented [ ] Tested [ ] Working
Tool #4 - Connection Monitor: [ ] Implemented [ ] Tested [ ] Working
Tool #5 - Activity Monitor: [ ] Implemented [ ] Tested [ ] Working
Tool #6 - Export Tool: [ ] Implemented [ ] Tested [ ] Working
Tool #7 - Presence History: [ ] Implemented [ ] Tested [ ] Working
```

---

## Testing Summary

### Overall Results
- **Total Test Scenarios:** 15
- **Passed:** ___/15
- **Failed:** ___/15
- **Blocked:** ___/15

### Critical Issues (Must Fix Before Production)
1. 
2. 
3. 

### Minor Issues (Can Fix Post-Launch)
1. 
2. 
3. 

### Performance Metrics
- Average message delivery time: ___ms
- Chat interface load time: ___ms
- Conversation list load time: ___ms
- File upload success rate: ___%

### Sign-off
- [ ] All critical tests pass
- [ ] Performance meets requirements  
- [ ] Database consistency verified
- [ ] Admin tools functional
- [ ] Ready for production deployment

**Tested by:** _______________  
**Date:** _______________  
**Version:** _______________

---

## Next Steps After Testing

1. **Fix all failing tests** - Don't proceed until ALL tests pass
2. **Performance optimization** - If any test is slow, optimize
3. **Security review** - Ensure no data leaks between users
4. **Load testing** - Test with 100+ concurrent users
5. **Mobile testing** - Test on actual iOS/Android devices
6. **Accessibility testing** - Screen readers, keyboard navigation
7. **Production deployment** - Only after 100% test pass rate

**Remember: The chat system is the heart of user interaction. It must be perfect before launch.**
