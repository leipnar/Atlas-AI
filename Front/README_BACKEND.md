# Atlas AI Support Assistant - Backend Development Guide

## 1. Overview

This document provides a comprehensive guide for developing the backend services for the Atlas AI Support Assistant. The backend is responsible for user authentication, data persistence, business logic, and secure communication with the Google Gemini API.

The current frontend operates with a mock API service (`src/services/apiService.ts`). This guide outlines the formal backend architecture and endpoints that this mock service is simulating. The goal is to replace the mock service with real HTTP calls to a production-ready backend built according to these specifications.

## 2. Recommended Tech Stack

-   **Runtime:** Node.js (LTS version)
-   **Framework:** Express.js
-   **Language:** TypeScript
-   **Database:** MongoDB (with Mongoose ODM) or PostgreSQL (with Prisma ORM). The schema below is presented with a NoSQL/document-based approach in mind, which aligns well with the current data structures.
-   **Authentication:** Session-based authentication using `express-session` or token-based (JWT).
-   **Password Hashing:** `bcrypt`
-   **Environment Variables:** `dotenv`

## 3. Project Structure (Recommended)

```
/
├── dist/                     // Compiled TypeScript output
├── src/
│   ├── api/                  // API route definitions (e.g., users.routes.ts)
│   ├── config/               // Configuration files (db connection, env vars)
│   ├── controllers/          // Request/response handlers (e.g., users.controller.ts)
│   ├── middleware/           // Express middleware (auth, error handling, permissions)
│   ├── models/               // Database schemas (e.g., User.model.ts)
│   ├── services/             // Business logic (e.g., gemini.service.ts)
│   ├── types/                // Shared TypeScript types (can be a shared package)
│   └── server.ts             // Main Express app entry point
├── .env                      // Environment variables
├── .gitignore
├── package.json
└── tsconfig.json
```

## 4. Database Schema

The database should contain collections/tables to store the application's state.

### 4.1. `users` Collection

Stores user credentials and profile information. Based on `UserCredentials` type.

```json
{
  "_id": "ObjectId",
  "username": { "type": "String", "unique": true, "required": true },
  "password": { "type": "String", "required": true }, // Hashed with bcrypt
  "firstName": "String",
  "lastName": "String",
  "email": { "type": "String", "unique": true, "required": true },
  "mobile": "String",
  "role": { "type": "String", "enum": ["admin", "manager", "supervisor", "support", "client"], "required": true },
  "emailVerified": { "type": "Boolean", "default": false },
  "createdAt": "Date",
  "lastLogin": {
      "timestamp": "Date",
      "ip": "String",
      "device": "String",
      "os": "String"
  }
}
```

### 4.2. `knowledge_base` Collection

Stores the knowledge entries that the AI uses to answer questions. Based on `KnowledgeEntry` type.

```json
{
  "_id": "ObjectId",
  "tag": { "type": "String", "required": true },
  "content": { "type": "String", "required": true },
  "lastUpdated": { "type": "Date", "default": "Date.now" },
  "updatedBy": { "type": "String" } // Stores the username of the updater
}
```

### 4.3. `conversations` Collection

Stores the full chat logs for review. Based on `Conversation` type.

```json
{
  "_id": "ObjectId",
  "userId": { "type": "ObjectId", "ref": "User" },
  "startTime": { "type": "Date", "required": true },
  "messages": [
    {
      "id": "String", // Unique message ID
      "sender": { "type": "String", "enum": ["user", "atlas"] },
      "text": "String",
      "timestamp": "Date",
      "isError": { "type": "Boolean", "default": false },
      "feedback": { "type": "String", "enum": ["good", "bad", null] }
    }
  ]
}
```

### 4.4. `application_config` Collection

A single-document collection to store global settings.

```json
{
  "_id": "ObjectId", // There should only be one document in this collection
  "permissions": { /* Object matching AllRolePermissions type */ },
  "modelConfig": { /* Object matching ModelConfig type */ },
  "companyInfo": { /* Object matching CompanyInfo type */ },
  "smtpConfig": { /* Object matching SmtpConfig type */ },
  "geminiApiKey": "String" // Encrypted
}
```
**Security Note:** The `geminiApiKey` and `smtpConfig.password` should be encrypted at rest in the database or, preferably, stored securely in a secret management service (like AWS Secrets Manager, GCP Secret Manager, or HashiCorp Vault) and loaded into environment variables at runtime.

## 5. API Endpoints

The following RESTful API endpoints should be created to replace the mock service. All routes should be prefixed, e.g., `/api/v1`.

### 5.1. Authentication (`/api/auth`)

-   **`POST /login`**: Authenticates a user.
    -   Body: `{ username, password }`
    -   Response: `{ success: true, user: User }` or `{ success: false, message: string }`
-   **`POST /logout`**: Clears the user's session.
-   **`GET /me`**: Returns the currently logged-in user from the session.
-   **`POST /passkey/register`**: (Advanced) Initiates passkey registration.
-   **`POST /passkey/login`**: (Advanced) Authenticates with a passkey.

### 5.2. Users (`/api/users`)

-   **`GET /`**: Retrieves a paginated list of users. Supports query params: `page`, `limit`, `search`, `role`.
    -   Requires `canManageUsers` permission.
-   **`POST /`**: Creates a new user.
    -   Body: `UserCredentials`
    -   Requires `canManageUsers` permission.
-   **`PUT /:username`**: Updates a user's profile.
    -   Body: `Partial<UserCredentials>`
    -   Requires `canManageUsers` permission, or the user must be updating their own profile.
-   **`DELETE /:username`**: Deletes a user.
    -   Requires `canManageUsers` permission.
-   **`POST /:username/reset-password`**: Admin resets a user's password.
    -   Requires `canManageUsers` permission.
-   **`POST /:username/resend-verification`**: Resends a verification email.
    -   Requires `canManageUsers` permission.
-   **`POST /update-password`**: Authenticated user changes their own password.
    -   Body: `{ currentPassword, newPassword }`

### 5.3. Knowledge Base (`/api/kb`)

-   **`GET /`**: Retrieves all knowledge base entries.
-   **`POST /`**: Creates a new knowledge entry.
    -   Requires `canManageKnowledgeBase` permission.
-   **`PUT /:id`**: Updates an existing entry.
    -   Requires `canManageKnowledgeBase` permission.
-   **`DELETE /:id`**: Deletes an entry.
    -   Requires `canManageKnowledgeBase` permission.

### 5.4. Chat Logs (`/api/logs`)

-   **`GET /`**: Retrieves a paginated list of conversation summaries. Supports `page`, `limit`, `search`.
    -   Requires `canViewChatLogs` permission.
-   **`GET /:id`**: Retrieves a full single conversation by its ID.
    -   Requires `canViewChatLogs` permission.

### 5.5. Configuration (`/api/config`)

-   **`GET /permissions`**: Retrieves the role permissions object.
-   **`PUT /permissions`**: Updates the role permissions.
    -   Requires `canManageRoles` permission.
-   **`GET /model`**: Retrieves the current AI model configuration.
-   **`PUT /model`**: Updates the AI model configuration.
    -   Requires `canConfigureModel` permission.
-   **`GET /company`**: Retrieves company information.
-   **`PUT /company`**: Updates company information.
    -   Requires `canManageCompanyInfo` permission.
-   **`GET /smtp`**: Retrieves SMTP settings (without password).
-   **`PUT /smtp`**: Updates SMTP settings.
    -   Requires `canConfigureSmtp` permission.
-   **`GET /api-key/status`**: Returns boolean `isSet`. Does not return the key itself.
    -   Requires `canConfigureModel` permission.
-   **`POST /api-key`**: Sets/updates the Gemini API key.
    -   Requires `canConfigureModel` permission.

### 5.6. AI Service (`/api/chat`)

-   **`POST /feedback`**: Submits user feedback for a message.
    -   Body: `{ messageId: string, feedback: 'good' | 'bad' }`

## 6. Setup & Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create an environment file:** Create a `.env` file in the root directory and populate it with the necessary variables.
    ```
    # Server Configuration
    PORT=3001

    # Database Connection (Example for MongoDB)
    DATABASE_URL=mongodb://localhost:27017/atlas_ai

    # Authentication
    SESSION_SECRET=a_very_strong_and_long_random_string

    # Google Gemini API Key
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This command should use a tool like `nodemon` and `ts-node` to automatically restart the server on file changes.

5.  **Build for production:**
    ```bash
    npm run build
    npm start
    ```

## 7. Authentication & Authorization

-   **Authentication:** Implement a session-based authentication strategy. On successful login, create a session for the user and store their user ID. A cookie will be sent to the client to maintain the session.
-   **Authorization (Middleware):** Create middleware functions to protect routes.
    -   `isAuthenticated`: A middleware to check if a user session exists. All protected routes should use this.
    -   `hasPermission(permission: keyof RolePermissions)`: A middleware factory that checks if the authenticated user's role has the required permission (e.g., `hasPermission('canManageUsers')`). This should be used on all admin-level routes. The middleware will fetch the user from the database, look up their role, and check it against the stored `permissions` configuration.
