export const TOKENS = {
  // Services
  RedisService: Symbol.for('RedisService'),
  EventService: Symbol.for('EventService'),
  TokenBlacklistService: Symbol.for('TokenBlacklistService'),
  PasswordResetTokenService: Symbol.for('PasswordResetTokenService'),

  // Repositories
  UserRepository: Symbol.for('UserRepository'),
  ExampleRepository: Symbol.for('ExampleRepository'),

  // Domain services
  UserService: Symbol.for('UserService'),
  ExampleService: Symbol.for('ExampleService'),
  AuthService: Symbol.for('AuthService'),

  // Controllers
  UserController: Symbol.for('UserController'),
  ExampleController: Symbol.for('ExampleController'),
  AuthController: Symbol.for('AuthController'),
} as const;
