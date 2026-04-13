import { UserRepository } from '@/api/users/user.repository';
import UserService from '@/api/users/user.service';
import { BadRequestError } from '@/core';
import EventService from '@/services/event.service';

// Type-safe mock factories
function createMockRepository(): jest.Mocked<
  Pick<
    UserRepository,
    | 'create'
    | 'findById'
    | 'findAll'
    | 'updateById'
    | 'deleteById'
    | 'softDeleteById'
    | 'isEmailTaken'
  >
> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
    softDeleteById: jest.fn(),
    isEmailTaken: jest.fn(),
  };
}

function createMockEventService(): jest.Mocked<
  Pick<EventService, 'emitUserCreated' | 'emitUserDeleted'>
> {
  return {
    emitUserCreated: jest.fn(),
    emitUserDeleted: jest.fn(),
  };
}

describe('UserService', () => {
  const mockRepo = createMockRepository();
  const mockEvents = createMockEventService();
  const service = new UserService(
    mockRepo as unknown as UserRepository,
    mockEvents as unknown as EventService
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws BadRequestError when email is already taken', async () => {
    mockRepo.isEmailTaken.mockResolvedValue(true);

    await expect(
      service.create({ email: 'taken@example.com' })
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('creates user and emits UserCreated event', async () => {
    mockRepo.isEmailTaken.mockResolvedValue(false);
    mockRepo.create.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    } as never);

    const result = await service.create({ email: 'user@example.com' });

    expect(result).toEqual({ id: 'user-1', email: 'user@example.com' });
    expect(mockEvents.emitUserCreated).toHaveBeenCalledWith(result);
  });

  it('emits UserDeleted on hard delete', async () => {
    mockRepo.deleteById.mockResolvedValue({ id: 'user-1' } as never);

    const result = await service.remove('user-1');

    expect(result).toEqual({ id: 'user-1' });
    expect(mockEvents.emitUserDeleted).toHaveBeenCalledWith('user-1');
  });

  it('emits UserDeleted on soft delete', async () => {
    mockRepo.softDeleteById.mockResolvedValue({ id: 'user-1' } as never);

    const result = await service.softDelete('user-1');

    expect(result).toEqual({ id: 'user-1' });
    expect(mockEvents.emitUserDeleted).toHaveBeenCalledWith('user-1');
  });
});
