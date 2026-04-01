import { IUser } from '@/api/users/user.model';
import { UserRepository } from '@/api/users/user.repository';
import { BadRequestError, NotFoundError } from '@/core';
import EventService from '@/services/event.service';

export default class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventService: EventService
  ) {}

  async create(data: Partial<IUser>): Promise<IUser> {
    if (await this.userRepository.isEmailTaken(data.email as string)) {
      throw new BadRequestError('Email already taken');
    }
    const user = await this.userRepository.create(data);
    this.eventService.emitUserCreated(user);
    return user;
  }

  async findById(id: string): Promise<IUser | null> {
    return this.userRepository.findById(id);
  }

  async findAll(query: Record<string, unknown> = {}) {
    return this.userRepository.findAll(query);
  }

  async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    if (data.email) {
      const isTaken = await this.userRepository.isEmailTaken(data.email, id);
      if (isTaken) {
        throw new BadRequestError('Email already taken');
      }
    }
    return this.userRepository.updateById(id, data);
  }

  async remove(id: string): Promise<IUser | null> {
    const deleted = await this.userRepository.deleteById(id);
    if (deleted) {
      this.eventService.emitUserDeleted(deleted.id);
    }
    return deleted;
  }

  async softDelete(id: string): Promise<IUser | null> {
    const deleted = await this.userRepository.softDeleteById(id);
    if (deleted) {
      this.eventService.emitUserDeleted(deleted.id);
    }
    return deleted;
  }

  async restore(id: string): Promise<IUser | null> {
    return this.userRepository.restoreById(id);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.userRepository.findByEmail(email);
  }

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return this.userRepository.findByEmailWithPassword(email);
  }

  async getOrFail(id: string): Promise<IUser> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }
}
