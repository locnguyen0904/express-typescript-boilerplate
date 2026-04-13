import { Document } from 'mongoose';

export interface BaseDocument extends Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
