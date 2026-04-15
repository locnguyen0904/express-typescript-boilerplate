import { Request, Response } from 'express';

import UserService from '@/api/users/user.service';
import { CREATED, LIST, NotFoundError, OK } from '@/core';

export default class UserController {
  constructor(private readonly userService: UserService) {}

  async create(req: Request, res: Response): Promise<void> {
    const user = await this.userService.create(req.body);
    new CREATED({ data: user }).send(res);
  }

  async findOne(req: Request, res: Response): Promise<void> {
    const user = await this.userService.findById(req.params.id as string);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    new OK({ data: user }).send(res);
  }

  async findAll(req: Request, res: Response): Promise<void> {
    const result = await this.userService.findAll(req.query);
    new LIST({
      data: result.docs,
      total: result.totalDocs,
      page: result.page,
      pages: result.totalPages,
      limit: result.limit,
    }).send(res);
  }

  async update(req: Request, res: Response): Promise<void> {
    const user = await this.userService.update(
      req.params.id as string,
      req.body
    );
    if (!user) {
      throw new NotFoundError('User not found');
    }
    new OK({ data: user }).send(res);
  }

  async delete(req: Request, res: Response): Promise<void> {
    const user = await this.userService.remove(req.params.id as string);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    new OK({ data: user }).send(res);
  }
}
