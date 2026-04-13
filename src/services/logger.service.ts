import pino from 'pino';

import config from '@/config/env.config';

const isTest = config.env === 'test';
const isDev = config.env !== 'production' && !isTest;

const logger = pino({
  level: isTest ? 'silent' : config.logLevel,
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),
});

export default logger;
