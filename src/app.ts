import '@/api/users/user.events';

import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import api from '@/api';
import { healthHandler } from '@/api/health';
import { config, env, generateOpenApiDocs } from '@/config';
import {
  errorHandle,
  logErrors,
  notFoundHandle,
} from '@/helpers/handle-errors.helper';
import { getQueues } from '@/jobs';
import {
  apiLimiter,
  doubleCsrfProtection,
  generateCsrfToken,
  httpLogger,
  requestIdMiddleware,
} from '@/middlewares';

const rootApi = '/api/v1';

const app: Express = express();

app.set('trust proxy', config.env === 'production');

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(generateOpenApiDocs()));

// Security
app.use(helmet());
app.use(
  cors({
    origin:
      config.env === 'production'
        ? env.ALLOWED_ORIGINS?.split(',') || []
        : true,
    credentials: true,
  })
);
app.disable('x-powered-by');

// Rate Limiting
app.use(rootApi, apiLimiter);

// Request ID
app.use(requestIdMiddleware);

// HTTP Logger (pino-http)
app.use(httpLogger);

// Compression
app.use(compression());

app.use(cookieParser());

// Parse requests
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// CSRF Protection - Double Submit Cookie Pattern (stateless)
app.use(doubleCsrfProtection);

app.get('/api/v1/csrf-token', (req: Request, res: Response) => {
  const csrfToken = generateCsrfToken(req, res);
  res.json({ csrfToken });
});

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Welcome to express-typescript-boilerplate API!' });
});

app.get('/health', healthHandler);

// Bull Board - Queue monitoring UI (basic auth)
if (
  config.features.jobsEnabled &&
  config.bullBoard.username &&
  config.bullBoard.password
) {
  const bullBoardAdapter = new ExpressAdapter();
  bullBoardAdapter.setBasePath('/admin/queues');
  createBullBoard({
    queues: getQueues().map((q) => new BullMQAdapter(q)),
    serverAdapter: bullBoardAdapter,
  });
  app.use(
    '/admin/queues',
    (req: Request, res: Response, next) => {
      const auth = req.headers.authorization;
      if (auth?.startsWith('Basic ')) {
        const [username, password] = Buffer.from(auth.slice(6), 'base64')
          .toString()
          .split(':');
        if (
          username === config.bullBoard.username &&
          password === config.bullBoard.password
        ) {
          return next();
        }
      }
      res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board"');
      res.status(401).send('Authentication required');
    },
    bullBoardAdapter.getRouter()
  );
}

app.use(rootApi, api);

app.use(notFoundHandle);

app.use(logErrors);

app.use(errorHandle);

export default app;
