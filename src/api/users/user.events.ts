import { container, TOKENS } from '@/di';
import { logger } from '@/services';
import EventService, { EventNames } from '@/services/event.service';

import { IUser } from './user.interface';

const events = container.get<EventService>(TOKENS.EventService);

/**
 * User Created Event Handler
 * Triggered when a new user is created
 */
events.on(EventNames.UserCreated, (user: IUser) => {
  logger.info(
    { userId: user.id, email: user.email },
    `User created: ${user.id}`
  );
});

/**
 * User Deleted Event Handler
 * Triggered when a user is deleted (soft or hard)
 */
events.on(EventNames.UserDeleted, (userId: string) => {
  logger.info({ userId }, `User deleted: ${userId}`);
});
