import { inject, injectable } from 'inversify';

import { IUser, NewUser } from '@/api/users/user.interface';
import { UserRepository } from '@/api/users/user.repository';
import { BadRequestError, NotFoundError, type PaginatedResult } from '@/core';
import { TOKENS } from '@/di/tokens';
import EventService from '@/services/event.service';

@injectable()
export default class UserService {
  constructor(
    @inject(TOKENS.UserRepository)
    private readonly userRepository: UserRepository,
    @inject(TOKENS.EventService) private readonly eventService: EventService
  ) {}

  async create(data: NewUser): Promise<IUser> {
    if (await this.userRepository.isEmailTaken(data.email)) {
      throw new BadRequestError('Email already taken');
    }
    const user = await this.userRepository.create(data);
    this.eventService.emitUserCreated(user);
    return user;
  }

  async findById(id: string): Promise<IUser | null> {
    return this.userRepository.findById(id);
  }

  async findAll(
    page?: number,
    pageSize?: number
  ): Promise<PaginatedResult<IUser>> {
    return this.userRepository.findAll(page, pageSize);
  }

  async update(id: string, data: Partial<NewUser>): Promise<IUser | null> {
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
