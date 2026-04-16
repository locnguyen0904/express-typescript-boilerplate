import { EventEmitter } from 'events';
import { injectable } from 'inversify';

import { IUser } from '@/api/users/user.interface';

export const EventNames = {
  UserCreated: 'user.created',
  UserDeleted: 'user.deleted',
} as const;

@injectable()
export default class EventService extends EventEmitter {
  emitUserCreated(user: IUser) {
    this.emit(EventNames.UserCreated, user);
  }

  emitUserDeleted(userId: string) {
    this.emit(EventNames.UserDeleted, userId);
  }
}
