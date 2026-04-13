import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongooseDelete from 'mongoose-delete';
import mongoosePaginate from 'mongoose-paginate-v2';

import { BaseDocument } from '@/core';
import { applyPlugin } from '@/helpers';

export interface IExample extends BaseDocument {
  title: string;
  content: string;
}

const ExampleSchema = new Schema<IExample>(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

applyPlugin(ExampleSchema, mongooseDelete, {
  deletedAt: true,
  overrideMethods: 'all',
});
applyPlugin(ExampleSchema, mongooseAggregatePaginate);
applyPlugin(ExampleSchema, mongoosePaginate);

// Add index for createdAt (used for default sorting)
ExampleSchema.index({ createdAt: -1 });

const Example = mongoose.model<IExample>('Example', ExampleSchema);

export default Example;
