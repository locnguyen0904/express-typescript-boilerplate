/**
 * Composition Root — Manual Dependency Injection
 *
 * All service instances are created here and wired via constructors.
 * Import resolved instances from this file wherever needed.
 *
 * Order matters: dependencies must be instantiated before dependants.
 */

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

// 1. Shared services
const redisService = new RedisService();
const eventService = new EventService();
const tokenBlacklistService = new TokenBlacklistService(redisService);

// 2. User domain
const userRepository = new UserRepository();
const userService = new UserService(userRepository, eventService);
const userController = new UserController(userService);

// 3. Example domain
const exampleRepository = new ExampleRepository();
const exampleService = new ExampleService(exampleRepository, redisService);
const exampleController = new ExampleController(exampleService);

// 4. Auth domain
const authService = new AuthService(userService, tokenBlacklistService);
const authController = new AuthController(authService);

export {
  authController,
  authService,
  eventService,
  exampleController,
  exampleRepository,
  exampleService,
  redisService,
  tokenBlacklistService,
  userController,
  userRepository,
  userService,
};
