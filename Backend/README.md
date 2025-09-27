# Atlas AI Backend

The Node.js/Express backend API server for Atlas AI Support Assistant.

## Features

- **RESTful API**: Complete REST API for frontend integration
- **MongoDB Integration**: Database operations with Mongoose ODM
- **Authentication**: JWT-based authentication and session management
- **Security**: Comprehensive security measures (helmet, rate limiting, input validation)
- **AI Integration**: Google Gemini API integration for AI responses
- **File Uploads**: Secure file upload handling
- **Email Support**: SMTP integration for notifications
- **Logging**: Structured logging with different levels

## Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- MongoDB 5.0 or higher
- npm 8.0.0 or higher

### Installation

1. **Install Dependencies**:
```bash
npm install
```

2. **Environment Setup**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start Development Server**:
```bash
npm run dev
```

The server will start on `http://localhost:3001` by default.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get users list (admin)
- `POST /api/users` - Create new user (admin)
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)

### Knowledge Base
- `GET /api/kb` - Get knowledge base entries
- `POST /api/kb` - Create knowledge entry
- `PUT /api/kb/:id` - Update knowledge entry
- `DELETE /api/kb/:id` - Delete knowledge entry

### Chat
- `POST /api/chat` - Send chat message
- `GET /api/chat/history` - Get chat history
- `POST /api/chat/feedback` - Submit message feedback

### Configuration
- `GET /api/config/permissions` - Get role permissions
- `PUT /api/config/permissions` - Update permissions (admin)
- `GET /api/config/model` - Get AI model configuration
- `PUT /api/config/model` - Update model configuration (admin)

## Environment Variables

See `.env.example` for all available configuration options.

### Required Variables
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=mongodb://username:password@localhost:27017/atlas_ai
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
```

### Optional Variables
```bash
GEMINI_API_KEY=your_api_key
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_password
```

## Development

### Available Scripts
```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with initial data
```

### Project Structure
```
Backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # Route definitions
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   ├── config/         # Configuration files
│   └── server.js       # Main server file
├── tests/              # Test files
├── logs/               # Application logs
└── uploads/            # File uploads directory
```

## Security

### Implemented Security Measures
- **Helmet**: Security headers
- **Rate Limiting**: API rate limiting
- **Input Validation**: Request validation with express-validator
- **XSS Protection**: Cross-site scripting prevention
- **SQL Injection**: MongoDB injection prevention
- **Authentication**: JWT-based secure authentication
- **CORS**: Cross-origin resource sharing configuration

### Security Best Practices
- Use HTTPS in production
- Keep dependencies updated
- Use strong session secrets
- Implement proper error handling
- Log security events

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **Database Tests**: MongoDB integration testing

## Database

### Models
- **User**: User accounts and authentication
- **KnowledgeEntry**: Knowledge base entries
- **Conversation**: Chat conversations and history
- **ApplicationConfig**: Application configuration

### Migrations
Database migrations are handled automatically during deployment.

## Deployment

### Production Setup
1. **Environment**: Set `NODE_ENV=production`
2. **Database**: Configure production MongoDB
3. **SSL**: Set up SSL certificates
4. **Process Manager**: Use PM2 for process management

### Using Auto-Install
The backend is automatically configured when using the auto-install script:
```bash
curl -sSL https://raw.githubusercontent.com/leipnar/Atlas-AI/main/Auto%20Install/install.sh | bash -s -- --domain=yourdomain.com --email=your@email.com
```

## Monitoring

### Health Check
The server provides a health check endpoint:
```bash
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "database": "connected",
  "services": {
    "api": "healthy",
    "database": "healthy",
    "ai": "healthy"
  }
}
```

### Logging
Logs are structured and include:
- Request/response logging
- Error logging
- Security event logging
- Performance metrics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Style
- Use ESLint configuration
- Format code with Prettier
- Follow existing patterns
- Add JSDoc comments for functions

## License

MIT License - see [LICENSE](../LICENSE) file for details.