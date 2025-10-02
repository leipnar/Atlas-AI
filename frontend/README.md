# Atlas AI Support Assistant - Frontend

This is the frontend for the Atlas AI Support Assistant, a sophisticated web application designed to provide intelligent, context-aware support to users. It features a real-time chat interface powered by the Gemini API, a comprehensive admin dashboard for management and customization, and a robust, localizable UI.

## ✨ Features

-   **AI-Powered Chat:** A clean, intuitive chat interface where users can interact with the Gemini-powered AI assistant.
-   **Knowledge Base Grounding:** Ensures AI responses are grounded in a provided knowledge base, preventing hallucinations and ensuring accuracy.
-   **Comprehensive Admin Dashboard:** A feature-rich dashboard for administrators and support staff with different permission levels.
    -   **User & Role Management:** Create, edit, delete users and manage role-based permissions.
    -   **Knowledge Base Management:** Easily update the information the AI uses to answer questions.
    -   **Model & Panel Customization:** Configure the AI model, customize the chat's appearance, and localize text content.
    -   **Conversation History:** Review past conversations for quality assurance and support.
    -   **System Settings:** Configure SMTP for emails, manage backups, and more.
-   **Multi-Lingual Support:** Fully localized for English (en) and Persian (fa) with Right-to-Left (RTL) layout support.
-   **Secure Authentication:** Supports standard login, social logins (Google, Microsoft), and passwordless sign-in with Passkeys.
-   **Responsive Design:** A seamless experience across desktop and mobile devices.

## 🛠️ Tech Stack

-   **Framework:** React 19
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS
-   **AI:** Google Gemini API via `@google/genai` SDK
-   **Icons:** Lucide React
-   **Charts:** Chart.js

## 📂 Project Structure

The project is organized into logical directories and files to maintain clarity and scalability.

```
/
├── components/         # Reusable React components
├── i18n/               # Internationalization setup and locale files
│   ├── locales/
│   │   ├── en.json
│   │   └── fa.json
│   └── i18n.tsx        # Language provider and context hook
├── services/           # Business logic, API calls, etc.
│   ├── apiService.ts   # Mock backend API using localStorage
│   ├── geminiService.ts# Logic for interacting with the Gemini API
│   └── errors.ts       # Custom error types
├── App.tsx             # Main application component, handles state and routing
├── index.html          # The main HTML entry point
├── index.tsx           # React root renderer
├── constants.ts        # Shared constant values (e.g., user roles)
├── types.ts            # TypeScript type definitions
├── README.md           # This file
└── README_BACKEND.md   # Detailed documentation for the mock backend API
```

## 🚀 Getting Started

This project is set up to run in a modern web development environment that supports ES modules directly in the browser.

1.  **Serve the files:** Use a simple local server (like `live-server` or Python's `http.server`) to serve the project's root directory.
2.  **API Key:** The application requires a Google Gemini API key. This key must be provided as an environment variable named `API_KEY`. The `geminiService.ts` file is configured to read this key from `process.env.API_KEY`. You will need to ensure your development environment makes this variable available to the application.
3.  **Open in browser:** Navigate to the local server's address in your web browser.

## ⚙️ Backend

This project uses a mock backend implemented in `services/apiService.ts`. It simulates a full-featured backend API by storing all data (users, settings, chat logs, etc.) in the browser's `localStorage`. This allows for a complete, self-contained development and demo experience without needing a separate server process.

For a detailed breakdown of all available mock API endpoints, please see [README_BACKEND.md](./README_BACKEND.md).

## 🎨 Styling

Styling is handled primarily with **Tailwind CSS**, which is included via a CDN link in `index.html`. For animations and global styles that are difficult to achieve with utility classes alone, custom CSS is included within a `<style>` block in the `<head>` of `index.html`.

## 🌐 Internationalization (i18n)

The application is fully localized using a custom i18n solution.

-   **Provider:** `i18n/i18n.tsx` contains the `LanguageProvider` that wraps the entire application.
-   **Translations:** All display strings are stored in JSON files within `i18n/locales/`.
-   **Usage:** The `useTranslation()` hook provides the current language, a function to change it (`setLanguage`), and the translation function `t()`.
-   **RTL Support:** The provider automatically sets the `dir` attribute on the `<html>` tag and applies a custom font class to the `<body>` for Persian, ensuring correct layout and typography.
