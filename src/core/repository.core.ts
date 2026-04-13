import {
  Document,
  FilterQuery,
  Model,
  PaginateModel,
  PaginateOptions,
  PaginateResult,
  ProjectionType,
  QueryOptions,
  SoftDeleteModel,
  UpdateQuery,
} from 'mongoose';

import { BaseDocument } from './base-document.core';

export type LeanDoc<T> = T & { _id: string };

/**
 * Base Repository - Data Access Layer
 * Uses `new Model()` + `.save()` for create/update (triggers hooks)
 * Uses `.lean()` for read operations (better performance)
 */
export abstract class Repository<T extends BaseDocument> {
  constructor(protected readonly model: Model<T>) {}

  // CREATE

  async create(data: Partial<T>): Promise<T> {
    const doc = new this.model(data);
    await doc.save();
    return doc.toObject() as T;
  }

  async createMany(data: Partial<T>[]): Promise<T[]> {
    const docs = await this.model.insertMany(data, { ordered: false });
    return docs.map((doc) => (doc as Document).toObject() as T);
  }

  // READ

  async findById(
    id: string,
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>
  ): Promise<LeanDoc<T> | null> {
    const result = await this.model.findById(id, projection, options).lean();
    return result as LeanDoc<T> | null;
  }

  async findOne(
    filter: FilterQuery<T>,
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>
  ): Promise<LeanDoc<T> | null> {
    const result = await this.model.findOne(filter, projection, options).lean();
    return result as LeanDoc<T> | null;
  }

  async find(
    filter: FilterQuery<T> = {},
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>
  ): Promise<LeanDoc<T>[]> {
    const result = await this.model.find(filter, projection, options).lean();
    return result as LeanDoc<T>[];
  }

  async findAll(
    query: Record<string, unknown> = {}
  ): Promise<PaginateResult<T>> {
    const {
      page = 1,
      limit = 25,
      sort = '-createdAt',
      populate,
      select,
      includeDeleted,
      ...filter
    } = query;

    if (!this.isPaginateModel()) {
      throw new Error('Model does not support pagination');
    }

    const options: PaginateOptions = {
      page: Number(page),
      limit: Number(limit),
      sort: sort as string,
      lean: true,
    };

    if (populate) options.populate = populate as PaginateOptions['populate'];
    if (select) options.select = select as PaginateOptions['select'];
    if (includeDeleted === true || includeDeleted === 'true') {
      (options as Record<string, unknown>).withDeleted = true;
    }

    return this.model.paginate(filter as FilterQuery<T>, options);
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter);
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.exists(filter);
    return result !== null;
  }

  // UPDATE

  async updateById(id: string, data: UpdateQuery<T>): Promise<T | null> {
    const doc = await this.model.findById(id);
    if (!doc) return null;

    Object.assign(doc, data);
    await doc.save();
    return doc.toObject() as T;
  }

  async updateOne(
    filter: FilterQuery<T>,
    data: UpdateQuery<T>
  ): Promise<T | null> {
    const doc = await this.model.findOne(filter);
    if (!doc) return null;

    Object.assign(doc, data);
    await doc.save();
    return doc.toObject() as T;
  }

  async updateMany(
    filter: FilterQuery<T>,
    data: UpdateQuery<T>
  ): Promise<number> {
    const result = await this.model.updateMany(filter, data);
    return result.modifiedCount;
  }

  // DELETE (Hard)

  async deleteById(id: string): Promise<LeanDoc<T> | null> {
    const result = await this.model.findByIdAndDelete(id).lean();
    return result as LeanDoc<T> | null;
  }

  async deleteOne(filter: FilterQuery<T>): Promise<LeanDoc<T> | null> {
    const result = await this.model.findOneAndDelete(filter).lean();
    return result as LeanDoc<T> | null;
  }

  async deleteMany(filter: FilterQuery<T>): Promise<number> {
    const result = await this.model.deleteMany(filter);
    return result.deletedCount;
  }

  // SOFT DELETE (mongoose-delete)

  async softDeleteById(id: string): Promise<T | null> {
    if (!this.isSoftDeleteModel()) {
      throw new Error('Model does not support soft delete');
    }
    const doc = await this.model.findById(id);
    if (!doc) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (doc as any).delete();
    return doc.toObject() as T;
  }

  async restoreById(id: string): Promise<T | null> {
    if (!this.isSoftDeleteModel()) {
      throw new Error('Model does not support soft delete');
    }

    const softDeleteModel = this.model as unknown as SoftDeleteModel<T>;
    const doc = await softDeleteModel.findOneWithDeleted({
      _id: id,
    } as FilterQuery<T>);
    if (!doc) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (doc as any).restore();
    return doc.toObject() as T;
  }

  async findDeleted(filter: FilterQuery<T> = {}): Promise<LeanDoc<T>[]> {
    if (!this.isSoftDeleteModel()) {
      throw new Error('Model does not support soft delete');
    }
    const softDeleteModel = this.model as unknown as SoftDeleteModel<T>;
    const result = await softDeleteModel.findDeleted(filter).lean();
    return result as LeanDoc<T>[];
  }

  // UTILITIES

  getModel(): Model<T> {
    return this.model;
  }

  protected isSoftDeleteModel(): boolean {
    return (
      'delete' in this.model &&
      typeof (this.model as unknown as SoftDeleteModel<T>).delete === 'function'
    );
  }

  protected isPaginateModel(): this is this & {
    model: PaginateModel<T>;
  } {
    return (
      'paginate' in this.model &&
      typeof (this.model as unknown as PaginateModel<T>).paginate === 'function'
    );
  }
}
