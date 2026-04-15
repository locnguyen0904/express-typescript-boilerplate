import { Repository } from '@/core';
import { examples } from '@/db/schema';

import { IExample } from './example.interface';

export class ExampleRepository extends Repository<IExample> {
  constructor() {
    super(examples);
  }
}
