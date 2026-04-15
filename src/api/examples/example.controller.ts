import { Request, Response } from 'express';

import { CREATED, LIST, NotFoundError, OK } from '@/core';

import ExampleService from './example.service';

export default class ExampleController {
  constructor(private readonly exampleService: ExampleService) {}

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
    const result = await this.exampleService.findAll(req.query);
    new LIST({
      data: result.docs,
      total: result.totalDocs,
      page: result.page,
      pages: result.totalPages,
      limit: result.limit,
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
