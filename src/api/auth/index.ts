import './auth.doc';

import { Router } from 'express';
import validate from 'express-zod-safe';

import { loginSchema } from '@/api/auth/auth.validation';
import { container, TOKENS } from '@/di';
import { authLimiter } from '@/middlewares';

import AuthController from './auth.controller';

const router = Router();
const controller = container.get<AuthController>(TOKENS.AuthController);

router.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  controller.login.bind(controller)
);

router.post('/refresh-token', controller.refreshToken.bind(controller));

router.post('/logout', controller.logout.bind(controller));

export default router;
