import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';

import UserService from '@/api/users/user.service';
import { CREATED, LIST, NotFoundError, OK } from '@/core';
import { TOKENS } from '@/di/tokens';

@injectable()
export default class UserController {
  constructor(
    @inject(TOKENS.UserService) private readonly userService: UserService
  ) {}

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
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;
    const result = await this.userService.findAll(page, limit);
    new LIST({
      data: result.data,
      total: result.total,
      page,
      limit,
      pages: Math.ceil(result.total / limit),
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
