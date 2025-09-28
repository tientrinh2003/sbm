# 🤖 SmartBP Chatbot Integration Guide

## Overview
Hệ thống SmartBP đã được tích hợp với AI Chatbot để hỗ trợ:
- **Patient**: Tư vấn sức khỏe, hướng dẫn đo huyết áp
- **Doctor**: Phân tích lâm sàng, hỗ trợ chẩn đoán  
- **Admin**: Quản lý hệ thống, troubleshooting

## Prerequisites

### 1. Chatbot Backend Setup
Đảm bảo chatbot backend đã chạy ở `D:\PycharmProject\chatbot`:

```bash
cd "D:\PycharmProject\chatbot"
python app.py
# Server should run on http://localhost:5000
```

### 2. API Endpoint
Chatbot backend cần có endpoint `/chat` nhận POST request:

```json
{
  "message": "User message",
  "user_id": "user@example.com", 
  "conversation_id": "unique_conversation_id",
  "context": {
    "role": "PATIENT|DOCTOR|ADMIN",
    "timestamp": "2025-09-28T10:00:00Z"
  }
}
```

Response format:
```json
{
  "response": "AI response message",
  "conversation_id": "conversation_id"
}
```

## SmartBP Integration

### 1. API Proxy
- **File**: `app/api/chatbot/route.ts`
- **Function**: Proxy requests từ frontend đến chatbot backend
- **Authentication**: Kiểm tra session trước khi gửi request

### 2. Chat Interface
- **Component**: `components/ChatInterface.tsx`
- **Features**: 
  - Real-time messaging UI giống ChatGPT
  - Message history với timestamp
  - Typing indicators
  - Auto-scroll to bottom

### 3. Role-specific Pages
- **Patient Chat**: `/patient/chat` - Health consultation
- **Doctor Chat**: `/doctor/chat` - Clinical assistance  
- **Admin Chat**: `/admin/chat` - System management

### 4. Navigation
Updated `components/Sidebar.tsx` với chat links:
- Patient: "AI Assistant" 
- Doctor: "Clinical AI"
- Admin: "System AI"

## Configuration

### Environment Variables
Add to `.env.local`:

```bash
# Chatbot Backend Configuration
CHATBOT_API_URL=http://localhost:5000
CHATBOT_API_KEY=your_api_key_if_needed

# Enable/disable chatbot feature
ENABLE_CHATBOT=true
```

### System Prompts
Each role has specialized prompts trong chat pages:

- **Patient**: Health advice, device usage, BP interpretation
- **Doctor**: Clinical analysis, treatment guidance, medical info
- **Admin**: System management, troubleshooting, optimization

## Testing

### 1. Start Services
```bash
# Terminal 1: Chatbot Backend
cd "D:\PycharmProject\chatbot"
python app.py

# Terminal 2: SmartBP Frontend  
cd "D:\New folder\sbm"
npm run dev
```

### 2. Test Flow
1. Login to SmartBP system
2. Navigate to respective chat page:
   - Patient: http://localhost:3000/patient/chat
   - Doctor: http://localhost:3000/doctor/chat  
   - Admin: http://localhost:3000/admin/chat
3. Send test messages
4. Verify responses từ chatbot backend

### 3. Debug
Check browser console và network tab for:
- API request/response
- Authentication errors
- Connection issues with chatbot backend

## Features

### ✅ Completed
- [x] API proxy endpoint
- [x] Chat interface component
- [x] Role-specific chat pages
- [x] Navigation integration
- [x] System prompts for each role

### 🔄 Next Steps
- [ ] Message persistence in database
- [ ] File upload trong chat
- [ ] Chat history search
- [ ] Admin chat analytics
- [ ] Multi-language support

## Troubleshooting

### Common Issues

#### 1. Chatbot Backend Not Running
**Error**: `Failed to get chatbot response`
**Solution**: 
```bash
cd "D:\PycharmProject\chatbot"
python app.py
```

#### 2. CORS Issues  
**Error**: Cross-origin request blocked
**Solution**: Add CORS headers trong chatbot backend:
```python
from flask_cors import CORS
CORS(app)
```

#### 3. Authentication Failed
**Error**: `Unauthorized`
**Solution**: Đăng nhập lại hoặc check session

#### 4. Port Conflicts
**Error**: Port 5000 in use
**Solution**: Change port trong chatbot hoặc update `CHATBOT_API_URL`

## API Documentation

### SmartBP → Chatbot
```
POST /api/chatbot
Content-Type: application/json
Authorization: NextAuth session

{
  "message": "string",
  "conversationId": "string (optional)"
}
```

### Response
```json
{
  "success": true,
  "response": "AI response",
  "conversationId": "conversation_id"
}
```

## Security Notes

1. **Authentication**: Tất cả chat requests require valid session
2. **Rate Limiting**: Consider adding rate limits cho chat API
3. **Input Validation**: Sanitize user inputs trước khi gửi đến chatbot
4. **Logging**: Log chat interactions cho debugging (không log sensitive data)

## Performance

- **Caching**: Consider cache common responses
- **Streaming**: Implement streaming responses cho long answers
- **Optimization**: Minimize API calls với conversation context

---

**Ready to use!** 🚀

Chatbot integration hoàn tất. Users có thể chat với AI assistant phù hợp với role của họ trong hệ thống SmartBP.