import { EventEmitter } from 'events';

import { IUser } from '@/api/users/user.model';

export const EventNames = {
  UserCreated: 'user.created',
  UserDeleted: 'user.deleted',
} as const;

export default class EventService extends EventEmitter {
  emitUserCreated(user: IUser) {
    this.emit(EventNames.UserCreated, user);
  }

  emitUserDeleted(userId: string) {
    this.emit(EventNames.UserDeleted, userId);
  }
}
