import { Repository } from '@/core';

import Example, { IExample } from './example.model';

export class ExampleRepository extends Repository<IExample> {
  constructor() {
    super(Example);
  }
}
