# Chat Debug Checklist

## Test 1: Input Clearing
1. Open property page
2. Click "Contact Host"
3. Type "test message"
4. Click Send button
5. **Expected**: Input should be empty immediately
6. **Check**: Is the input still showing text?

## Test 2: Message Persistence
1. Send a message "Hello"
2. **Check console logs**: Look for conversation ID
3. Close the chat modal
4. Refresh the page (F5)
5. Click "Contact Host" again
6. **Expected**: Should see "Hello" message
7. **Check console logs**: What conversation ID is being loaded?

## Key Questions:
- Is a new conversation being created each time?
- Is the conversation ID being passed correctly?
- Are messages being saved to database?
