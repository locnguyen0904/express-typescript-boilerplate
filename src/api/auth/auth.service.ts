import { randomUUID } from 'crypto';

import argon2 from 'argon2';
import { inject, injectable } from 'inversify';
import jwt from 'jsonwebtoken';

import { IUser } from '@/api/users/user.interface';
import UserService from '@/api/users/user.service';
import { config } from '@/config';
import { UnAuthorizedError } from '@/core';
import { TOKENS } from '@/di/tokens';
import logger from '@/services/logger.service';
import TokenBlacklistService from '@/services/token-blacklist.service';

import { AuthTokens } from './auth.interface';

@injectable()
export default class AuthService {
  constructor(
    @inject(TOKENS.UserService) private userService: UserService,
    @inject(TOKENS.TokenBlacklistService)
    private tokenBlacklist: TokenBlacklistService
  ) {}

  async loginWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<{ user: IUser; tokens: AuthTokens }> {
    const user = await this.userService.findByEmailWithPassword(email);
    if (!user || !(await this.verifyPassword(user, password))) {
      throw new UnAuthorizedError('Incorrect email or password');
    }
    const tokens = this.generateAuthTokens(user);
    return { user, tokens };
  }

  private async verifyPassword(
    user: IUser,
    password: string
  ): Promise<boolean> {
    if (!user.password) return false;
    return argon2.verify(user.password, password);
  }

  async refreshAuth(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, config.jwt.secret) as {
        sub: string;
        type: string;
        jti?: string;
        exp?: number;
      };
      if (payload.type !== 'refresh') {
        throw new UnAuthorizedError('Invalid token type');
      }

      if (!payload.jti || !payload.exp) {
        throw new UnAuthorizedError('Invalid refresh token');
      }

      if (await this.tokenBlacklist.isRevoked(payload.jti)) {
        throw new UnAuthorizedError('Refresh token has been revoked');
      }

      // Revoke the old refresh token
      const ttl = payload.exp - Math.floor(Date.now() / 1000);
      await this.tokenBlacklist.revoke(payload.jti, ttl);

      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new UnAuthorizedError('User not found');
      }
      return this.generateAuthTokens(user);
    } catch (error) {
      logger.error({ error }, 'Token refresh failed');
      throw new UnAuthorizedError('Please authenticate');
    }
  }

  generateAuthTokens(user: IUser) {
    const accessTokenExpires =
      Math.floor(Date.now() / 1000) + config.jwt.accessExpirationMinutes * 60;
    const accessToken = jwt.sign(
      { sub: user.id, role: user.role, type: 'access', jti: randomUUID() },
      config.jwt.secret,
      { expiresIn: config.jwt.accessExpirationMinutes * 60 }
    );

    const refreshTokenExpires =
      Math.floor(Date.now() / 1000) +
      config.jwt.refreshExpirationDays * 24 * 60 * 60;
    const refreshToken = jwt.sign(
      { sub: user.id, type: 'refresh', jti: randomUUID() },
      config.jwt.secret,
      { expiresIn: `${config.jwt.refreshExpirationDays}d` }
    );

    return {
      access: {
        token: accessToken,
        expires: new Date(accessTokenExpires * 1000),
      },
      refresh: {
        token: refreshToken,
        expires: new Date(refreshTokenExpires * 1000),
      },
    };
  }

  async revokeToken(
    token: string,
    expectedType?: 'access' | 'refresh'
  ): Promise<void> {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as {
        type?: string;
        jti?: string;
        exp?: number;
      };

      if (expectedType && payload.type !== expectedType) {
        return;
      }

      if (payload.jti && payload.exp) {
        const ttl = payload.exp - Math.floor(Date.now() / 1000);
        await this.tokenBlacklist.revoke(payload.jti, ttl);
      }
    } catch {
      // Ignore invalid or expired token during logout/revocation flow
    }
  }

  async revokeAccessToken(token: string): Promise<void> {
    await this.revokeToken(token, 'access');
  }
}
