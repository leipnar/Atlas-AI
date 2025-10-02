  import { Request, Response } from 'express';
  import { AuthService } from '../services';
  import { LoginRequest, ApiResponse, UserDocument } from '../types';
  import { transformUser } from '../utils/transform';
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

  export const login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password }: LoginRequest = req.body;

      const result = await AuthService.login(username, password);

      if (result.success && result.user) {
        req.session.userId = result.user._id;

        await AuthService.updateLastLogin(
          result.user._id,
          req.ip || 'unknown',
          req.get('User-Agent') || 'unknown'
        );

        const transformedUser = transformUser(result.user as any as UserDocument);
        res.json({ success: true, user: transformedUser });
      } else {
        res.json({ success: false, message: result.message });
      }
    } catch (error) {
      console.error('Login controller error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
          res.status(500).json({
            success: false,
            message: 'Logout failed'
          } as ApiResponse);
          return;
        }

        res.clearCookie('atlas.session');
        res.json({ success: true });
      });
    } catch (error) {
      console.error('Logout controller error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json(null);
        return;
      }

      res.json(req.user);
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json(null);
    }
  };

  export const generatePasskeyRegistrationOptions = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.session.userId) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      const user = await User.findById(req.session.userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const existingCredentials = (user.passkeyCredentials || []).map(cred => ({
        id: Buffer.from(cred.credentialID, 'base64'),
        type: 'public-key' as const,
        transports: cred.transports as AuthenticatorTransportFuture[],
      }));

      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userID: user._id.toString(),
        userName: user.username,
        userDisplayName: `${user.firstName} ${user.lastName}`,
        attestationType: 'none',
        excludeCredentials: existingCredentials,
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
        },
      });

      user.currentChallenge = options.challenge;
      await user.save();

      res.json({ success: true, options });
    } catch (error) {
      console.error('Generate passkey registration options error:', error);
      res.status(500).json({ success: false, message: 'Failed to generate registration options' });
    }
  };

  export const verifyPasskeyRegistration = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.session.userId) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      const user = await User.findById(req.session.userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (!user.currentChallenge) {
        res.status(400).json({ success: false, message: 'No challenge found' });
        return;
      }

      const { credential }: { credential: RegistrationResponseJSON } = req.body;

      const verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge: user.currentChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
      });

      if (!verification.verified || !verification.registrationInfo) {
        res.json({ success: false, message: 'Verification failed' });
        return;
      }

      const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

      if (!user.passkeyCredentials) {
        user.passkeyCredentials = [];
      }

      user.passkeyCredentials.push({
        credentialID: Buffer.from(credentialID).toString('base64'),
        credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64'),
        counter,
        transports: credential.response.transports,
      });

      user.currentChallenge = undefined;
      await user.save();

      res.json({ success: true, message: 'Passkey registered successfully' });
    } catch (error) {
      console.error('Verify passkey registration error:', error);
      res.status(500).json({ success: false, message: 'Failed to verify registration' });
    }
  };

  export const generatePasskeyAuthenticationOptions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username } = req.body;

      if (!username) {
        res.status(400).json({ success: false, message: 'Username required' });
        return;
      }

      const user = await User.findOne({ username });
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (!user.passkeyCredentials || user.passkeyCredentials.length === 0) {
        res.status(400).json({ success: false, message: 'No passkeys registered for this user' });
        return;
      }

      const allowCredentials = user.passkeyCredentials.map(cred => ({
        id: Buffer.from(cred.credentialID, 'base64'),
        type: 'public-key' as const,
        transports: cred.transports as AuthenticatorTransportFuture[],
      }));

      const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        allowCredentials,
        userVerification: 'preferred',
      });

      user.currentChallenge = options.challenge;
      await user.save();

      res.json({ success: true, options });
    } catch (error) {
      console.error('Generate passkey authentication options error:', error);
      res.status(500).json({ success: false, message: 'Failed to generate authentication options' });
    }
  };

  export const verifyPasskeyAuthentication = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, credential }: { username: string; credential: AuthenticationResponseJSON } = req.body;

      if (!username) {
        res.status(400).json({ success: false, message: 'Username required' });
        return;
      }

      const user = await User.findOne({ username });
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (!user.currentChallenge) {
        res.status(400).json({ success: false, message: 'No challenge found' });
        return;
      }

      const credentialID = credential.id;
      const passkeyCredential = user.passkeyCredentials?.find(
        cred => cred.credentialID === Buffer.from(credentialID, 'base64url').toString('base64')
      );

      if (!passkeyCredential) {
        res.status(400).json({ success: false, message: 'Passkey not found for this user' });
        return;
      }

      const verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge: user.currentChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        authenticator: {
          credentialID: Buffer.from(passkeyCredential.credentialID, 'base64'),
          credentialPublicKey: Buffer.from(passkeyCredential.credentialPublicKey, 'base64'),
          counter: passkeyCredential.counter,
        },
      });

      if (!verification.verified) {
        res.json({ success: false, message: 'Authentication failed' });
        return;
      }

      passkeyCredential.counter = verification.authenticationInfo.newCounter;
      user.currentChallenge = undefined;
      await user.save();

      req.session.userId = user._id;

      await AuthService.updateLastLogin(
        user._id,
        req.ip || 'unknown',
        req.get('User-Agent') || 'unknown'
      );

      const transformedUser = transformUser(user as any as UserDocument);
      res.json({ success: true, user: transformedUser });
    } catch (error) {
      console.error('Verify passkey authentication error:', error);
      res.status(500).json({ success: false, message: 'Failed to verify authentication' });
    }
  };