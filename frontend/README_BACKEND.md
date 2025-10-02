# Atlas AI - Backend API Specification (Mock)

This document outlines the expected API endpoints and data structures for the Atlas AI Support Assistant backend. The current implementation uses a mock API (`apiService.ts`) that simulates this backend using `localStorage`.

All API calls are simulated with a latency of around 300ms to mimic real network conditions.

## Base URL

All endpoints are prefixed with `/api`.

## Authentication

-   `POST /api/login`
    -   **Body:** `{ "username": "...", "password": "..." }`
    -   **Response (Success):** `{ "success": true, "user": UserCredentials }`
    -   **Response (Failure):** `{ "success": false, "message": "..." }`
-   `POST /api/social-login`
    -   **Body:** `{ "provider": "google" | "microsoft" }`
    -   **Response:** `{ "success": true, "user": UserCredentials }`
-   `POST /api/login-passkey`
    -   **Body:** `{ "username": "..." }`
    -   **Response (Success):** `{ "success": true, "user": User }` (Note: returns a partial user object, frontend completes login)
    -   **Response (Failure):** `{ "success": false, "message": "..." }`
-   `POST /api/logout`
    -   **Response:** `{ "success": true }`
-   `GET /api/current-user`
    -   **Response:** Returns the current `UserCredentials` object or `null`.

## User Management (`/api/users`)

-   `GET /`
    -   **Query Params:** `page`, `limit`, `search`, `role`
    -   **Response:** `{ "users": [UserCredentials...], "totalPages": number }`
-   `POST /`
    -   **Body:** `UserCredentials` object.
    -   **Response:** `{ "success": true, "message": "..." }`
-   `PUT /:username`
    -   **Body:** `Partial<UserCredentials>`
    -   **Response:** `{ "success": true, "user": UserCredentials }`
-   `DELETE /:username`
    -   **Response:** `{ "success": true }`
-   `POST /import`
    -   **Body:** `UserCredentials[]`
    -   **Response:** `{ "success": true, "message": "..." }`
-   `POST /:username/update-password`
    -   **Body:** `{ "currentPassword": "...", "newPassword": "..." }`
    -   **Response:** `{ "success": true, "message": "..." }`
-   `POST /:username/register-passkey`
    -   Simulates WebAuthn registration flow.
    -   **Response:** `{ "success": true, "message": "..." }`

## Knowledge Base (`/api/kb`)

-   `GET /`
    -   **Response:** `KnowledgeEntry[]`
-   `POST /`
    -   **Body:** `Omit<KnowledgeEntry, 'id'>`.
    -   **Response:** `KnowledgeEntry`
-   `PUT /:id`
    -   **Body:** `KnowledgeEntry`.
    -   **Response:** `KnowledgeEntry`
-   `DELETE /:id`
    -   **Response:** `{ "success": true }`

## Chat Logs & Feedback (`/api/logs`)

-   `GET /`
    -   **Query Params:** `page`, `limit`, `search`
    -   **Response:** `{ "logs": [ConversationSummary...], "totalPages": number }`
-   `GET /:id`
    -   **Response:** `Conversation` object.
-   `POST /feedback`
    -   **Body:** `{ "messageId": "...", "feedback": "good" | "bad" }`
    -   **Response:** `{ "success": true }`

## Dashboard Statistics (`/api/stats`)

-   `GET /activity`
    -   Returns chat activity for the last 30 days.
    -   **Response:** `[{ date: string, count: number }...]`
-   `GET /feedback`
    -   **Response:** `{ good: number, bad: number }`
-   `GET /kb-count` -> `number`
-   `GET /log-count` -> `number`
-   `GET /role-distribution`
    -   **Response:** `Record<UserRole, number>`
-   `GET /unanswered-count` -> `number`
-   `GET /user-count` -> `number`
-   `GET /volume-by-hour`
    -   Returns an array of 24 numbers, representing message counts for each hour.
    -   **Response:** `number[]`

## Configuration (`/api/config`)

The application configuration is managed through a single, large JSON object on the backend, accessible via specific endpoints.

### Endpoints

-   `GET /permissions` -> `AllRolePermissions`
-   `PUT /permissions` -> **Body:** `AllRolePermissions`
-   `GET /model` -> `ModelConfig`
-   `PUT /model` -> **Body:** `ModelConfig`
-   `GET /company` -> `CompanyInfo`
-   `PUT /company` -> **Body:** `CompanyInfo`
-   `GET /panel` -> `PanelConfig`
-   `PUT /panel` -> **Body:** `PanelConfig`
-   `GET /smtp` -> `SmtpConfig`
-   `PUT /smtp` -> **Body:** `SmtpConfig`
-   `POST /smtp/test` -> **Body:** `{ "recipient": "..." }`

### API Keys

-   `GET /api-keys` -> `ApiKeys`
-   `POST /api-keys` -> **Body:** `Partial<ApiKeys>`

### Custom OpenRouter Models

-   `GET /custom-models` -> `CustomOpenRouterModel[]`
-   `POST /custom-models` -> **Body:** `CustomOpenRouterModel`
-   `PUT /custom-models/:id` -> **Body:** `CustomOpenRouterModel`
-   `DELETE /custom-models/:id`

## Backup & Restore (`/api/backup`)

-   `GET /`
    -   **Query Params:** `type` (optional, one of `panelConfig`, `modelConfig`, `knowledgeBase`, `database`, `smtpConfig`, `companyInfo`, `permissions`, `full`)
    -   **Response:** JSON object containing the requested data parts.
-   `POST /restore`
    -   **Body:** A valid backup JSON file content.
    -   **Response:** `{ "success": true }`

### Automatic Backups

-   `GET /backup-schedule` -> `BackupSchedule`
-   `PUT /backup-schedule` -> **Body:** `BackupSchedule`
-   `GET /gdrive` -> `GoogleDriveConfig`
-   `POST /gdrive/connect` -> Simulates OAuth, returns updated `GoogleDriveConfig`.
-   `POST /gdrive/disconnect` -> Disconnects, returns updated `GoogleDriveConfig`.
