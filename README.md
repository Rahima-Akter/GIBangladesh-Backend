# GI Bangladesh Backend

Production-ready backend API for the GI Bangladesh platform.

This backend powers:

- Authentication & Authorization
- Product Management
- Blog System
- Comments & Engagement
- AI Features
- Analytics Dashboard
- Admin Management

Built with scalable architecture using:

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- Better Auth
- Zod
- JWT
- TanStack-ready APIs

---

# 🚀 Tech Stack

## Core Backend
- Node.js
- Express.js
- TypeScript

## Database
- PostgreSQL
- Prisma ORM

## Authentication
- Better Auth
- JWT
- Role-Based Access Control (RBAC)

## Validation
- Zod

## Logging & Security
- Morgan
- Helmet
- CORS
- Rate Limiting

## AI Integration
- OpenAI / Gemini APIs

---

# 📁 Project Structure

```txt
src/
│
├── app.ts
├── server.ts
│
├── config/
├── prisma/
├── modules/
├── middlewares/
├── utils/
├── helpers/
├── errors/
├── interfaces/
├── routes/
├── constants/
├── lib/
└── types/
```

---

# 📦 Module Structure

Each module follows a scalable architecture:

```txt
module-name/
│
├── module.route.ts
├── module.controller.ts
├── module.service.ts
├── module.validation.ts
└── module.types.ts
```

Example:

```txt
product/
├── product.route.ts
├── product.controller.ts
├── product.service.ts
├── product.validation.ts
└── product.types.ts
```

---

# 🔐 Authentication System

Authentication is implemented using:

- Better Auth
- JWT
- Cookie-based session support

## Roles

```ts
USER
ADMIN
SUPER_ADMIN
```

## Permission Rules

| Action | USER | ADMIN | SUPER_ADMIN |
|---|---|---|---|
| Create Product | ❌ | ✅ | ✅ |
| Update Product | ❌ | ✅ | ✅ |
| Delete Product | ❌ | ✅ | ✅ |
| Create Blog | ✅ | ✅ | ✅ |
| Update Own Blog | ✅ | ✅ | ✅ |
| Delete Blog | ❌ | ✅ | ✅ |
| Delete Users | ❌ | ❌ | ✅ |
| Delete Admin | ❌ | ❌ | ✅ |

---

# 🛍 Product System

## Features

- Product CRUD
- Product views tracking
- Product engagement
- Multiple categories
- Search & filtering
- Pagination
- Related products

## Product Fields

- Title
- Description
- Cover Image
- Origin
- Tags
- Crafting Steps
- GI Registration
- Cultural History
- Likes
- Dislikes
- Views

---

# 📝 Blog System

## Features

- User-created blogs
- Default published status
- Blog views tracking
- Likes & comments
- Ownership validation

## Rules

- Users can create blogs
- Users can only edit their own blogs
- Admin/Super Admin can delete blogs

---

# 💬 Comment System

Unified comment architecture:

- Product comments
- Blog comments
- Nested replies
- Soft delete support

---

# 🤖 AI Features

Minimum 4 real AI-powered features:

## Planned AI Features

### 1. AI Content Generator
Generate:
- Product descriptions
- Blog content
- Summaries

### 2. AI Text Rewriter
Rewrite content into:
- Professional
- Short
- Formal
- Friendly styles

### 3. AI Chat Assistant
Context-aware assistant inside the platform.

### 4. AI Hashtag Generator
Generate social media hashtags.

---

# 🧠 AI Logging System

All AI requests are logged:

- Prompt
- Response
- Errors
- Token usage
- User tracking

This helps:
- Analytics
- Monitoring
- Abuse prevention
- AI optimization

---

# 📊 Analytics System

Tracks:

- Product views
- Blog views
- AI usage
- User activity
- Dashboard metrics

Dashboard charts are powered by real analytics data.

---

# 🛡 Security Features

## Implemented

- Helmet
- CORS
- Secure Cookies
- JWT Verification
- Password Hashing
- Zod Validation
- Role Middleware
- Protected Routes

## Planned

- Rate Limiting
- Redis Caching
- Queue System
- Sentry Monitoring

---

# ⚡ Advanced Engineering Features

## Frontend Integration Ready

- Server Components compatible APIs
- Optimistic UI support
- Pagination
- Infinite scrolling support

## Backend Features

- Modular architecture
- Global error handling
- Logging system
- Centralized responses
- Service layer separation

---

# 🌍 Environment Variables

Create a `.env` file:

```env
PORT=5000

DATABASE_URL=

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

NODE_ENV=development
```

---

# 📥 Installation

## Clone Repository

```bash
git clone <repository-url>
```

## Install Dependencies

```bash
npm install
```

## Generate Prisma Client

```bash
npx prisma generate
```

## Run Migrations

```bash
npx prisma migrate dev
```

## Start Development Server

```bash
npm run dev
```

---

# 📜 Available Scripts

```bash
npm run dev
```
Run development server.

```bash
npm run build
```
Build project.

```bash
npm run start
```
Run production build.

```bash
npm run lint
```
Run ESLint.

---

# 🧪 API Response Format

## Success Response

```json
{
  "success": true,
  "message": "Product fetched successfully",
  "data": {}
}
```

## Error Response

```json
{
  "success": false,
  "message": "Something went wrong",
  "error": {}
}
```

---

# 📈 Future Improvements

Planned features:

- Redis caching
- BullMQ queue system
- Notification system
- Real-time activity feed
- WebSockets
- AI recommendation engine
- Search indexing
- CDN image optimization

---

# 🧑‍💻 Development Guidelines

## Rules

- TypeScript everywhere
- No `any` without justification
- Modular architecture only
- Validation required on all inputs
- Controllers must stay thin
- Business logic belongs in services

---

# 📄 License

This project is developed for educational and portfolio purposes.

---

# ✨ Author

GI Bangladesh Backend System
Built with scalable backend engineering principles.