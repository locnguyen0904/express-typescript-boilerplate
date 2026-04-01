import { EventEmitter } from 'events';

import EventService, { EventNames } from '@/services/event.service';

describe('EventService', () => {
  let service: EventService;

  beforeEach(() => {
    service = new EventService();
  });

  it('should be an instance of EventEmitter', () => {
    expect(service).toBeInstanceOf(EventEmitter);
  });

  describe('emitUserCreated', () => {
    it('should emit UserCreated event with user data', (done) => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
      } as unknown as Parameters<typeof service.emitUserCreated>[0];

      service.on(EventNames.UserCreated, (user) => {
        expect(user).toEqual(mockUser);
        done();
      });

      service.emitUserCreated(mockUser);
    });
  });

  describe('emitUserDeleted', () => {
    it('should emit UserDeleted event with userId', (done) => {
      const userId = 'user-1';

      service.on(EventNames.UserDeleted, (id) => {
        expect(id).toBe(userId);
        done();
      });

      service.emitUserDeleted(userId);
    });
  });
});
