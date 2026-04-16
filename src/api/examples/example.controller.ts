import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';

import { CREATED, LIST, NotFoundError, OK } from '@/core';
import { TOKENS } from '@/di/tokens';

import ExampleService from './example.service';

@injectable()
export default class ExampleController {
  constructor(
    @inject(TOKENS.ExampleService)
    private readonly exampleService: ExampleService
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    const example = await this.exampleService.create(req.body);
    new CREATED({ data: example }).send(res);
  }

  async findOne(req: Request, res: Response): Promise<void> {
    const example = await this.exampleService.findById(req.params.id as string);
    if (!example) {
      throw new NotFoundError('Example not found');
    }
    new OK({ data: example }).send(res);
  }

  async findAll(req: Request, res: Response): Promise<void> {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;
    const result = await this.exampleService.findAll(page, limit);
    new LIST({
      data: result.data,
      total: result.total,
      page,
      limit,
      pages: Math.ceil(result.total / limit),
    }).send(res);
  }

  async update(req: Request, res: Response): Promise<void> {
    const example = await this.exampleService.update(
      req.params.id as string,
      req.body
    );
    if (!example) {
      throw new NotFoundError('Example not found');
    }
    new OK({ data: example }).send(res);
  }

  async delete(req: Request, res: Response): Promise<void> {
    const example = await this.exampleService.remove(req.params.id as string);
    if (!example) {
      throw new NotFoundError('Example not found');
    }
    new OK({ data: example }).send(res);
  }
}
