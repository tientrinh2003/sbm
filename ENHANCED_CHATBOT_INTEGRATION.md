# 🚀 Enhanced SmartBP Chatbot Integration Setup Guide

## 📋 Tổng quan
Hệ thống SmartBP đã được nâng cấp với chatbot AI thông minh, tích hợp sâu với database và hỗ trợ context theo role người dùng.

## 🏗️ Kiến trúc mới

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   SBM Frontend  │    │   Next.js API    │    │  Python Chatbot    │
│   (Next.js)     │───▶│   (/api/chatbot) │───▶│   (FastAPI + RAG)   │
│                 │    │                  │    │                     │
│ • Chat UI       │    │ • User Context   │    │ • Role-based AI     │
│ • Role Context  │    │ • DB Queries     │    │ • Medical Knowledge │
│ • Suggestions   │    │ • Data Analysis  │    │ • LangChain + Ollama│
└─────────────────┘    └──────────────────┘    └─────────────────────┘
         │                        │                         │
         │                        ▼                         │
         │              ┌──────────────────┐                │
         │              │   PostgreSQL     │                │
         │              │   (Prisma ORM)   │                │
         │              │                  │                │
         └──────────────│ • Users          │◀───────────────┘
                        │ • Measurements   │
                        │ • Assignments    │
                        └──────────────────┘
```

## 🔧 Setup Instructions

### 1. Backend Chatbot Setup

```bash
cd "D:\PycharmProject\chatbot"

# Cập nhật requirements.txt nếu cần
pip install -r requirements.txt

# Chạy enhanced chatbot
python enhanced_chatbot_api.py
```

**Requirements mới:**
- FastAPI với enhanced request/response models
- Role-based prompt templates
- User context integration
- Medical data analysis

### 2. Frontend Integration Setup

```bash
cd "d:\New folder\sbm"

# Install dependencies nếu cần
pnpm install

# Tạo .env.local với DATABASE_URL
# Chạy migrations
pnpm prisma:generate
pnpm prisma:migrate

# Start development server
pnpm dev
```

### 3. Database Setup

Đảm bảo có dữ liệu test:

```bash
pnpm seed  # Tạo test users và measurements
```

## 🎯 Features mới

### 🔐 Role-based Context
- **PATIENT**: Personalized health insights với measurement data
- **DOCTOR**: Clinical decision support với patient statistics  
- **ADMIN**: System management và analytics

### 📊 Smart Data Integration
```typescript
// Patient context tự động
{
  latest_measurements: MeasurementData[],
  measurement_count: number,
  avg_sys: number,
  avg_dia: number, 
  risk_assessment: string
}

// Doctor context tự động  
{
  assigned_patients_count: number,
  recent_alerts: string[],
  pending_reviews: number
}
```

### 🧠 Enhanced AI Responses
- Sử dụng measurement data thực tế
- Đề xuất actions cụ thể
- Warning cho trường hợp khẩn cấp
- Suggestions theo role

## 🧪 Testing Workflow

### Test 1: Patient Experience
1. Login với PATIENT account
2. Thêm measurements (manual hoặc bluetooth)
3. Chat với bot về huyết áp
4. Kiểm tra AI references measurement data

### Test 2: Doctor Experience  
1. Login với DOCTOR account
2. Assign patients
3. Chat về patient management
4. Kiểm tra AI hiển thị statistics

### Test 3: Admin Experience
1. Login với ADMIN account  
2. Chat về system management
3. Kiểm tra admin-specific responses

## 🔍 API Endpoints

### POST /api/chatbot (Enhanced)
```json
{
  "message": "Huyết áp của tôi thế nào?",
  "conversationId": "optional"
}
```

**Auto-injected context:**
- User profile (role, name, demographics)
- Measurement history (last 10 readings)
- Role-specific statistics
- Medical assignments (doctor-patient)

### Response Structure
```json
{
  "success": true,
  "response": "AI response text",
  "conversation_id": "unique_id",
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "requires_medical_attention": false,
  "data_insights": {
    "mentioned_measurements": true,
    "health_recommendations": [],
    "follow_up_actions": []
  }
}
```

## 🎨 UI Components

### EnhancedChatInterface
- Role badges
- Contextual suggestions
- Medical attention alerts
- Measurement data references
- Real-time typing indicators

### Integration Points
```typescript
// Sử dụng trong pages
import EnhancedChatInterface from '@/components/EnhancedChatInterface';

<EnhancedChatInterface
  title="Patient Health Assistant"
  roleContext={{
    showMeasurements: true,
    showPatientInsights: true
  }}
/>
```

## 🚨 Health & Safety

### Medical Attention Detection
Bot tự động detect:
- High BP readings (>180/110)
- Emergency keywords
- Critical symptoms descriptions

### Response Examples:
- "Bạn nên đi khám bác sĩ hoặc đến cơ sở y tế ngay lập tức"
- Medical attention flag trong UI
- Urgent suggestions prioritized

## 📈 Performance Monitoring

### Logs to Monitor:
- Chat response times
- Database query performance  
- RAG retrieval accuracy
- User engagement metrics

### Health Checks:
- `GET /health` - Chatbot backend
- Database connectivity
- Ollama model availability
- API response validation

## 🔧 Troubleshooting

### Common Issues:

1. **Chatbot not responding**
   - Check `python enhanced_chatbot_api.py` running on port 5000
   - Verify Ollama models downloaded
   - Check CORS configuration

2. **Missing user context**  
   - Verify database connection
   - Check Prisma queries in API route
   - Validate session authentication

3. **Type errors**
   - Update `types/chatbot.ts` imports
   - Check TypeScript compilation
   - Validate API contracts

## 🚀 Production Deployment

### Environment Variables:
```bash
# Chatbot
LLM_MODEL=llama3.1:8b
EMBEDDING_MODEL=nomic-embed-text
CORS_ORIGINS=https://yourdomain.com
DATA_DIR=./data
PERSIST_DIR=./db

# Next.js  
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://yourdomain.com
```

### Docker Support:
```dockerfile
# Thêm chatbot service vào docker-compose
version: '3.8'
services:
  chatbot:
    build: ./chatbot
    ports:
      - "5000:5000"
    environment:
      - LLM_MODEL=llama3.1:8b
    volumes:
      - ./chatbot/data:/app/data
```

## ✅ Verification Checklist

- [ ] Enhanced chatbot API running (port 5000)
- [ ] Next.js dev server running (port 3000)  
- [ ] Database migrations applied
- [ ] Test users created with measurements
- [ ] Chat interface loads without errors
- [ ] Role-based responses working
- [ ] Medical attention detection working
- [ ] Suggestions displaying correctly
- [ ] Error handling graceful

---

**🎉 Integration hoàn tất! SmartBP chatbot giờ đã thông minh và có context đầy đủ.**