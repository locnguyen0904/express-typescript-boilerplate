import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';

import AuthService from '@/api/auth/auth.service';
import { SuccessResponse, UnAuthorizedError } from '@/core';
import { TOKENS } from '@/di/tokens';
import { decrypt, encrypt } from '@/helpers/crypto.helper';

@injectable()
export default class AuthController {
  constructor(@inject(TOKENS.AuthService) private authService: AuthService) {}

  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const { user, tokens } = await this.authService.loginWithEmailAndPassword(
      email,
      password
    );

    res.cookie('refreshToken', encrypt(tokens.refresh.token), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      expires: tokens.refresh.expires,
    });

    new SuccessResponse({
      message: 'Login successfully',
      data: { user, token: tokens.access.token },
    }).send(res);
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const encryptedToken = req.cookies.refreshToken;
      if (!encryptedToken) {
        throw new UnAuthorizedError('No refresh token provided');
      }

      let refreshToken: string;
      try {
        refreshToken = decrypt(encryptedToken);
      } catch {
        throw new UnAuthorizedError('Invalid refresh token');
      }

      const tokens = await this.authService.refreshAuth(refreshToken);

      res.cookie('refreshToken', encrypt(tokens.refresh.token), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/v1/auth',
        expires: tokens.refresh.expires,
      });

      new SuccessResponse({
        message: 'Token refreshed',
        data: { token: tokens.access.token },
      }).send(res);
    } catch (error) {
      res.clearCookie('refreshToken', { path: '/api/v1/auth' });
      throw error;
    }
  }

  async logout(req: Request, res: Response) {
    // Revoke the access token if present
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      await this.authService.revokeAccessToken(authHeader.split(' ')[1]);
    }

    const encryptedRefreshToken = req.cookies.refreshToken as
      | string
      | undefined;
    if (encryptedRefreshToken) {
      try {
        const refreshToken = decrypt(encryptedRefreshToken);
        await this.authService.revokeToken(refreshToken, 'refresh');
      } catch {
        // Ignore malformed cookie during logout, still clear it below
      }
    }

    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    new SuccessResponse({ message: 'Logout successfully' }).send(res);
  }
}
