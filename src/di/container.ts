import 'reflect-metadata';

import { Container } from 'inversify';

import AuthController from '@/api/auth/auth.controller';
import AuthService from '@/api/auth/auth.service';
import ExampleController from '@/api/examples/example.controller';
import { ExampleRepository } from '@/api/examples/example.repository';
import ExampleService from '@/api/examples/example.service';
import UserController from '@/api/users/user.controller';
import { UserRepository } from '@/api/users/user.repository';
import UserService from '@/api/users/user.service';
import EventService from '@/services/event.service';
import RedisService from '@/services/redis.service';
import TokenBlacklistService from '@/services/token-blacklist.service';

import { TOKENS } from './tokens';

const container = new Container();

// Infrastructure
container
  .bind<RedisService>(TOKENS.RedisService)
  .to(RedisService)
  .inSingletonScope();
container
  .bind<EventService>(TOKENS.EventService)
  .to(EventService)
  .inSingletonScope();
container
  .bind<TokenBlacklistService>(TOKENS.TokenBlacklistService)
  .to(TokenBlacklistService)
  .inSingletonScope();

// Repositories
container
  .bind<UserRepository>(TOKENS.UserRepository)
  .to(UserRepository)
  .inSingletonScope();
container
  .bind<ExampleRepository>(TOKENS.ExampleRepository)
  .to(ExampleRepository)
  .inSingletonScope();

// Services
container
  .bind<UserService>(TOKENS.UserService)
  .to(UserService)
  .inSingletonScope();
container
  .bind<ExampleService>(TOKENS.ExampleService)
  .to(ExampleService)
  .inSingletonScope();
container
  .bind<AuthService>(TOKENS.AuthService)
  .to(AuthService)
  .inSingletonScope();

// Controllers
container
  .bind<UserController>(TOKENS.UserController)
  .to(UserController)
  .inSingletonScope();
container
  .bind<ExampleController>(TOKENS.ExampleController)
  .to(ExampleController)
  .inSingletonScope();
container
  .bind<AuthController>(TOKENS.AuthController)
  .to(AuthController)
  .inSingletonScope();

export { container };
