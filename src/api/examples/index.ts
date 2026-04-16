import './example.doc';

import { Router } from 'express';
import validate from 'express-zod-safe';

import { idParamSchema, listQuerySchema } from '@/common';
import { container, TOKENS } from '@/di';
import { authorize, isAuth } from '@/middlewares';

import ExampleController from './example.controller';
import { createExampleSchema, updateExampleSchema } from './example.validation';

const router: Router = Router();
const controller = container.get<ExampleController>(TOKENS.ExampleController);

router.get('/', validate({ query: listQuerySchema }), controller.findAll);
router.get('/:id', validate({ params: idParamSchema }), controller.findOne);

router.post(
  '/',
  isAuth,
  authorize('admin'),
  validate({ body: createExampleSchema }),
  controller.create
);
router.put(
  '/:id',
  isAuth,
  authorize('admin'),
  validate({ params: idParamSchema, body: updateExampleSchema }),
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
