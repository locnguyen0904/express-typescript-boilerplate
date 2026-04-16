import { inject, injectable } from 'inversify';

import { PaginatedResult } from '@/core';
import { TOKENS } from '@/di/tokens';
import { RedisService } from '@/services';

import { IExample, NewExample } from './example.interface';
import { ExampleRepository } from './example.repository';

@injectable()
export default class ExampleService {
  constructor(
    @inject(TOKENS.ExampleRepository)
    private readonly exampleRepository: ExampleRepository,
    @inject(TOKENS.RedisService) private readonly redis: RedisService
  ) {}

  private async invalidateListCache() {
    await this.redis.delByPrefix('examples:list:');
  }

  async create(data: NewExample): Promise<IExample> {
    const created = await this.exampleRepository.create(data);
    await this.invalidateListCache();
    return created;
  }

  async findById(id: string): Promise<IExample | null> {
    return this.exampleRepository.findById(id);
  }

  async findAll(
    page?: number,
    pageSize?: number
  ): Promise<PaginatedResult<IExample>> {
    if (!this.redis.isConnected) {
      return this.exampleRepository.findAll(page, pageSize);
    }

    const cacheKey = `examples:list:${page}:${pageSize}`;
    const cached = await this.redis.get<PaginatedResult<IExample>>(cacheKey);

    if (cached) {
      return cached;
    }

    const result = await this.exampleRepository.findAll(page, pageSize);
    await this.redis.set(cacheKey, result, 300);
    return result;
  }

  async update(
    id: string,
    data: Partial<NewExample>
  ): Promise<IExample | null> {
    const updated = await this.exampleRepository.updateById(id, data);
    if (updated) {
      await this.invalidateListCache();
    }
    return updated;
  }

  async remove(id: string): Promise<IExample | null> {
    const deleted = await this.exampleRepository.deleteById(id);
    if (deleted) {
      await this.invalidateListCache();
    }
    return deleted;
  }
}
