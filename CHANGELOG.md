# Changelog

All notable changes to the Atlas AI Support Assistant project will be documented in this file.

## [1.1.0] - 2025-10-04

### Added
- ✨ **WebAuthn Passkey Authentication** - Complete implementation of passwordless authentication
  - Biometric authentication support (fingerprint, face recognition)
  - Security key support (YubiKey, etc.)
  - Passkey registration in user profile
  - Passkey login on authentication page
  - Debug logging for troubleshooting

### Fixed
- 🐛 **Passkey Authentication Bug** - Fixed critical credential ID encoding mismatch
  - Changed from base64 to base64url encoding for consistency
  - Fixed credential matching during authentication
  - Resolved "Passkey not found" errors
  - Fixed "Cannot read properties of undefined (reading 'counter')" errors

- 🔧 **TypeScript Compilation Errors** - Resolved all type checking issues
  - Fixed session type access in controllers
  - Fixed session type access in middleware
  - Added proper type casting for session.userId
  - Fixed user ID type conversion in auth service
  - Updated tsconfig.json with proper typeRoots

### Changed
- 📝 **Authentication Controller** (`src/controllers/auth.controller.ts`)
  - Line 165: Changed credential storage to base64url format
  - Line 97-100: Updated excludeCredentials to use base64url
  - Line 202-205: Updated allowCredentials to use base64url
  - Line 243-276: Improved credential matching logic
  - Added comprehensive debug logging

- 🔐 **Authentication Middleware** (`src/middleware/auth.ts`)
  - Fixed session type handling with proper type casting

- ⏱️ **Session Timeout Middleware** (`src/middleware/sessionTimeout.ts`)
  - Fixed session type access

- 🔑 **Auth Service** (`src/services/auth.service.ts`)
  - Fixed user ID type conversion to string

- ⚙️ **TypeScript Configuration** (`tsconfig.json`)
  - Added typeRoots for proper type resolution

### Technical Details

#### Passkey Implementation
- **Registration Flow:**
  1. User requests registration → generates options
  2. Browser prompts for biometric/security key
  3. Credential verified and stored in base64url format

- **Authentication Flow:**
  1. User enters username → generates auth options
  2. Browser prompts for biometric/security key
  3. Credential matched using direct string comparison
  4. User authenticated on successful verification

#### Encoding Format
- **credentialID:** base64url (consistent with browser)
- **credentialPublicKey:** base64 (for storage)
- **Challenge:** Generated per-request, stored temporarily

### Breaking Changes
⚠️ **Users with previously registered passkeys must re-register them** due to encoding format change from base64 to base64url.

### Migration Steps
```javascript
// Clear all existing passkeys in MongoDB
db.users.updateMany(
  {},
  {
    $set: {
      passkeyCredentials: [],
      currentChallenge: null
    }
  }
)
```

### Deployment Checklist
- [ ] Backup current code
- [ ] Deploy updated TypeScript files
- [ ] Run `npm install`
- [ ] Run `npm run build`
- [ ] Clear existing passkeys from database
- [ ] Restart server
- [ ] Test passkey registration
- [ ] Test passkey login

### Files Modified
**Backend:**
- `backend/src/controllers/auth.controller.ts`
- `backend/src/middleware/auth.ts`
- `backend/src/middleware/sessionTimeout.ts`
- `backend/src/services/auth.service.ts`
- `backend/tsconfig.json`

**Documentation:**
- `PASSKEY_DEPLOYMENT_GUIDE.md` (new)
- `CHANGELOG.md` (new)

### Dependencies
No new dependencies added. Using existing:
- `@simplewebauthn/server@9.0.3`
- TypeScript compilation tools

---

## [1.0.0] - 2025-10-02

### Initial Release
- 🎉 First production release of Atlas AI Support Assistant
- User authentication with username/password
- Admin dashboard
- Knowledge base management
- Chat interface with AI support
- Role-based access control
- Session management
- MongoDB database integration

### Features
- User management (CRUD operations)
- Role-based permissions (Admin, Manager, Supervisor, Support, Client)
- Knowledge base Q&A system
- Real-time chat with AI assistant
- Conversation logging
- Model configuration
- Company information management
- SMTP configuration

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.1.0 | 2025-10-04 | Passkey authentication + bug fixes |
| 1.0.0 | 2025-10-02 | Initial release |

---

**Notes:**
- Versions follow [Semantic Versioning](https://semver.org/)
- Breaking changes are clearly marked with ⚠️
- See [PASSKEY_DEPLOYMENT_GUIDE.md](./PASSKEY_DEPLOYMENT_GUIDE.md) for deployment instructions
