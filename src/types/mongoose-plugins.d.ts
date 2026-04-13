import { Document, FilterQuery, Query } from 'mongoose';
import MongooseDelete from 'mongoose-delete';

declare module 'mongoose' {
  interface SoftDeleteModel<
    T extends Document,
  > extends MongooseDelete.SoftDeleteModel<T> {
    delete(filter?: FilterQuery<T>): Promise<{ deletedCount: number }>;
    deleteById(id: string | Document): Promise<T | null>;
    restoreById(id: string | Document): Promise<T | null>;
    findOneWithDeleted(filter?: FilterQuery<T>): Query<T | null, T>;
    findDeleted(filter?: FilterQuery<T>): Query<T[], T>;
  }

  interface PaginateModelWithDeleted<T extends Document>
    extends PaginateModel<T>, SoftDeleteModel<T> {}
}
