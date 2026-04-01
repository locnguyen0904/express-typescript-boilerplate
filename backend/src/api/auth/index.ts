import './auth.doc';

import { Router } from 'express';
import validate from 'express-zod-safe';

import { loginSchema } from '@/api/auth/auth.validation';
import { authController } from '@/container';
import { authLimiter } from '@/middlewares';

const router = Router();
const controller = authController;

router.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  controller.login.bind(controller)
);

router.post('/refresh-token', controller.refreshToken.bind(controller));

router.post('/logout', controller.logout.bind(controller));

export default router;
