import { Container, ResolutionContext } from 'inversify';

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

const autoBindControllerMethods = <T extends object>(
  _context: ResolutionContext,
  instance: T
): T => {
  let proto = Object.getPrototypeOf(instance);

  while (proto && proto !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key === 'constructor') continue;

      const descriptor = Object.getOwnPropertyDescriptor(proto, key);
      if (!descriptor || typeof descriptor.value !== 'function') continue;

      const boundMethod = descriptor.value.bind(instance);
      (instance as Record<string, unknown>)[key] = boundMethod;
    }

    proto = Object.getPrototypeOf(proto);
  }

  return instance;
};

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
  .inSingletonScope()
  .onActivation(autoBindControllerMethods);
container
  .bind<ExampleController>(TOKENS.ExampleController)
  .to(ExampleController)
  .inSingletonScope()
  .onActivation(autoBindControllerMethods);
container
  .bind<AuthController>(TOKENS.AuthController)
  .to(AuthController)
  .inSingletonScope()
  .onActivation(autoBindControllerMethods);

export { container };
