import { Router } from 'express';

import auth from './auth';
import examples from './examples';
import health from './health';
import users from './users';

const router: Router = Router();

router.use('/examples', examples);
router.use('/auth', auth);
router.use('/users', users);
router.use('/health', health);

export default router;
