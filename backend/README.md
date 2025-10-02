# Atlas AI Support Assistant - Backend

This is the backend API for the Atlas AI Support Assistant application, built with Node.js, Express.js, TypeScript, and MongoDB.

## Features

- **Authentication & Authorization**: Session-based authentication with role-based permissions
- **User Management**: CRUD operations for user accounts with different roles
- **Knowledge Base**: Manage AI training data and knowledge entries
- **Chat Logs**: Store and retrieve conversation history
- **Configuration Management**: Manage AI model settings, company info, and SMTP configuration
- **AI Integration**: Google Gemini API integration for AI responses
- **Security**: Rate limiting, CORS, helmet security headers

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: express-session with MongoDB store
- **Password Hashing**: bcrypt
- **AI Provider**: Google Gemini API
- **Validation**: Joi

## Installation

1. **Clone and navigate to the backend directory**:
   ```bash
   cd Back
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** in `.env`:
   ```env
   # Server Configuration
   PORT=3001

   # Database Connection
   DATABASE_URL=mongodb://localhost:27017/atlas_ai

   # Authentication
   SESSION_SECRET=your_very_strong_session_secret_here

   # Google Gemini API Key
   GEMINI_API_KEY=your_gemini_api_key_here

   # Environment
   NODE_ENV=development
   
   # Session Timeout Configuration (in milliseconds)
   SESSION_ABSOLUTE_TIMEOUT=86400000  # 24 hours - Maximum session duration
   SESSION_IDLE_TIMEOUT=1800000       # 30 minutes - Inactivity timeout
   ```

5. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

6. **Run the development server**:
   ```bash
   npm run dev
   ```

7. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

All API endpoints are prefixed with `/api/v1`:

### Authentication (`/api/v1/auth`)
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /me` - Get current user

### Users (`/api/v1/users`)
- `GET /` - Get all users (paginated)
- `POST /` - Create new user
- `PUT /:username` - Update user
- `DELETE /:username` - Delete user
- `POST /:username/reset-password` - Reset user password
- `POST /update-password` - Update own password

### Knowledge Base (`/api/v1/kb`)
- `GET /` - Get all knowledge entries
- `POST /` - Create knowledge entry
- `PUT /:id` - Update knowledge entry
- `DELETE /:id` - Delete knowledge entry

### Chat Logs (`/api/v1/logs`)
- `GET /` - Get conversations (paginated)
- `GET /:id` - Get specific conversation

### Configuration (`/api/v1/config`)
- `GET/PUT /permissions` - Manage role permissions
- `GET/PUT /model` - Manage AI model configuration
- `GET/PUT /company` - Manage company information
- `GET/PUT /smtp` - Manage SMTP settings
- `GET /api-key/status` - Check API key status
- `POST /api-key` - Update API key

### Chat (`/api/v1/chat`)
- `POST /feedback` - Submit message feedback

## Development

### Scripts
- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Project Structure
```
src/
├── api/                 # API route definitions
├── config/              # Configuration files (database, session)
├── controllers/         # Request/response handlers
├── middleware/          # Express middleware
├── models/              # Database schemas
├── services/            # Business logic
├── types/               # TypeScript type definitions
└── server.ts            # Main application entry point
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `DATABASE_URL` | MongoDB connection string | `mongodb://localhost:27017/atlas_ai` |
| `SESSION_SECRET` | Session encryption secret | Required |
| `GEMINI_API_KEY` | Google Gemini API key | Required |
| `NODE_ENV` | Environment mode | `development` |
| `SESSION_ABSOLUTE_TIMEOUT` | Maximum session duration (ms) | `86400000` (24 hours) |
| `SESSION_IDLE_TIMEOUT` | Session inactivity timeout (ms) | `1800000` (30 minutes) |

## Security

- Rate limiting (100 requests per 15 minutes per IP)
- CORS protection
- Helmet security headers
- Session-based authentication with configurable timeouts
- Password hashing with bcrypt
- Input validation with Joi
- Role-based access control

## Health Check

The server provides a health check endpoint:
```
GET /health
```

Returns server status and basic information.

## License

MIT License