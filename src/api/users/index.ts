import './user.doc';

import { Router } from 'express';
import validate from 'express-zod-safe';

import { idParamSchema, listQuerySchema } from '@/common';
import { container, TOKENS } from '@/di';
import { authorize, isAuth } from '@/middlewares';

import UserController from './user.controller';
import { createUserSchema, updateUserSchema } from './user.validation';

const router = Router();
const controller = container.get<UserController>(TOKENS.UserController);

router.get(
  '/',
  isAuth,
  authorize('admin'),
  validate({ query: listQuerySchema }),
  controller.findAll
);
router.get(
  '/:id',
  isAuth,
  authorize('admin'),
  validate({ params: idParamSchema }),
  controller.findOne
);
router.post(
  '/',
  isAuth,
  authorize('admin'),
  validate({ body: createUserSchema }),
  controller.create
);
router.put(
  '/:id',
  isAuth,
  authorize('admin'),
  validate({ params: idParamSchema, body: updateUserSchema }),
  controller.update
);
router.delete(
  '/:id',
  isAuth,
  authorize('admin'),
  validate({ params: idParamSchema }),
  controller.delete
);

export default router;
