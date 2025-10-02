# Passkey Implementation - Step by Step Instructions

## Progress So Far
✅ User model updated with passkey fields
✅ @simplewebauthn/server@9.0.3 installed

## Remaining Steps

### 1. Update Auth Controller Imports

Add these imports at the top of `backend/src/controllers/auth.controller.ts`:

```typescript
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/server/script/deps';
import User from '../models/User.model';

const RP_NAME = 'Atlas AI Support Assistant';
const RP_ID = process.env.RP_ID || 'localhost';
const ORIGIN = process.env.ORIGIN || 'http://localhost:3000';
```

### 2. Replace Passkey Functions

Replace the old `registerPasskey` and `loginWithPasskey` functions with these 4 new functions.

See the file: PASSKEY_CONTROLLER_FUNCTIONS.txt for the complete implementation.

### 3. Update Auth Routes

In `backend/src/api/auth.routes.ts`, replace the passkey routes with:

```typescript
// Passkey routes
router.post('/passkey/register-options', isAuthenticated, authController.generatePasskeyRegistrationOptions);
router.post('/passkey/register-verify', isAuthenticated, authController.verifyPasskeyRegistration);
router.post('/passkey/auth-options', authController.generatePasskeyAuthenticationOptions);
router.post('/passkey/auth-verify', authController.verifyPasskeyAuthentication);
```

### 4. Update Frontend API Service

See PASSKEY_FRONTEND_API.txt for the updated API service functions.

### 5. Update Account Settings Component

See PASSKEY_ACCOUNT_SETTINGS.txt for the updated registration handler.

### 6. Update Login Page Component

See PASSKEY_LOGIN_PAGE.txt for the updated login handler.

### 7. Add Environment Variables

Add to `backend/.env`:
```
RP_ID=localhost
ORIGIN=http://localhost:3000
```

For production, use your actual domain.

### 8. Test

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Login with password
4. Go to Account Settings
5. Click "Register Passkey"
6. Follow browser prompts
7. Logout
8. Click passkey icon on login
9. Enter username
10. Authenticate with passkey

