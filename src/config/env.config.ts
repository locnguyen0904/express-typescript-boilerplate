import { env } from './env.schema';

interface IDatabaseConfig {
  url: string;
  poolSize: number;
}

interface IJwtConfig {
  secret: string;
  accessExpirationMinutes: number;
  refreshExpirationDays: number;
}

interface IAdminConfig {
  name: string;
  email: string;
  password?: string;
}

interface IFirebaseConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

interface IRedisConfig {
  enabled: boolean;
  url?: string;
}

interface IFeatureConfig {
  jobsEnabled: boolean;
}

interface IConfig {
  database: IDatabaseConfig;
  jwt: IJwtConfig;
  admin: IAdminConfig;
  firebase: IFirebaseConfig;
  redis: IRedisConfig;
  features: IFeatureConfig;
  bullBoard: {
    username?: string;
    password?: string;
  };
  env: string;
  port?: number;
  logLevel: string;
}

const config: IConfig = {
  database: {
    url: env.DATABASE_URL,
    poolSize: 10,
  },
  jwt: {
    secret: env.JWT_SECRET,
    accessExpirationMinutes: env.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: env.JWT_REFRESH_EXPIRATION_DAYS,
  },
  admin: {
    name: env.ADMIN_NAME,
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
  },
  firebase: {
    projectId: env.FIREBASE_PROJECT_ID || '',
    clientEmail: env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: (env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },
  redis: {
    enabled: env.CACHE_ENABLED,
    url: env.REDIS_URL,
  },
  features: {
    jobsEnabled: env.JOBS_ENABLED,
  },
  bullBoard: {
    username: env.BULL_BOARD_USERNAME,
    password: env.BULL_BOARD_PASSWORD,
  },
  env: env.NODE_ENV,
  port: env.PORT,
  logLevel: env.LOG_LEVEL || 'info',
};

export default config;
