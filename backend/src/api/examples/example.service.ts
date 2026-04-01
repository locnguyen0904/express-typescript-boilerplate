import { PaginateResult } from 'mongoose';

import { RedisService } from '@/services';

import { IExample } from './example.model';
import { ExampleRepository } from './example.repository';

export default class ExampleService {
  constructor(
    private readonly exampleRepository: ExampleRepository,
    private readonly redis: RedisService
  ) {}

  private async invalidateListCache() {
    await this.redis.delByPrefix('examples:list:');
  }

  async create(data: Partial<IExample>): Promise<IExample> {
    const created = await this.exampleRepository.create(data);
    await this.invalidateListCache();
    return created;
  }

  async findById(id: string): Promise<IExample | null> {
    return this.exampleRepository.findById(id);
  }

  async findAll(
    query: Record<string, unknown> = {}
  ): Promise<PaginateResult<IExample>> {
    if (!this.redis.isConnected) {
      return this.exampleRepository.findAll(query);
    }

    const cacheKey = `examples:list:${JSON.stringify(query)}`;
    const cached = await this.redis.get<PaginateResult<IExample>>(cacheKey);

    if (cached) {
      return cached;
    }

    const result = await this.exampleRepository.findAll(query);
    await this.redis.set(cacheKey, result, 300);
    return result;
  }

  async update(id: string, data: Partial<IExample>): Promise<IExample | null> {
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

  async softDelete(id: string): Promise<IExample | null> {
    const deleted = await this.exampleRepository.softDeleteById(id);
    if (deleted) {
      await this.invalidateListCache();
    }
    return deleted;
  }

  async restore(id: string): Promise<IExample | null> {
    const restored = await this.exampleRepository.restoreById(id);
    if (restored) {
      await this.invalidateListCache();
    }
    return restored;
  }
}
