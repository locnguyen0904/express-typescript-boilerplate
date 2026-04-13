import QueryBuilder from '@/helpers/query-builder.helper';

interface TestDoc {
  name: string;
  age: number;
  status: string;
  tags: string[];
  location: { type: string; coordinates: [number, number] };
}

describe('QueryBuilder', () => {
  let builder: QueryBuilder<TestDoc>;

  beforeEach(() => {
    builder = new QueryBuilder<TestDoc>();
  });

  describe('Comparison Operators', () => {
    it('where() adds equality condition', () => {
      const query = builder.where('name', 'John').build();
      expect(query).toEqual({ name: 'John' });
    });

    it('whereNot() adds $ne condition', () => {
      const query = builder.whereNot('status', 'inactive').build();
      expect(query).toEqual({ status: { $ne: 'inactive' } });
    });

    it('whereIn() adds $in condition', () => {
      const query = builder.whereIn('status', ['active', 'pending']).build();
      expect(query).toEqual({ status: { $in: ['active', 'pending'] } });
    });

    it('whereNotIn() adds $nin condition', () => {
      const query = builder.whereNotIn('status', ['deleted']).build();
      expect(query).toEqual({ status: { $nin: ['deleted'] } });
    });

    it('whereGreaterThan() adds $gt condition', () => {
      const query = builder.whereGreaterThan('age', 18).build();
      expect(query).toEqual({ age: { $gt: 18 } });
    });

    it('whereGreaterThanOrEqual() adds $gte condition', () => {
      const query = builder.whereGreaterThanOrEqual('age', 18).build();
      expect(query).toEqual({ age: { $gte: 18 } });
    });

    it('whereLessThan() adds $lt condition', () => {
      const query = builder.whereLessThan('age', 65).build();
      expect(query).toEqual({ age: { $lt: 65 } });
    });

    it('whereLessThanOrEqual() adds $lte condition', () => {
      const query = builder.whereLessThanOrEqual('age', 65).build();
      expect(query).toEqual({ age: { $lte: 65 } });
    });

    it('whereBetween() adds range condition', () => {
      const query = builder.whereBetween('age', 18, 65).build();
      expect(query).toEqual({ age: { $gte: 18, $lte: 65 } });
    });
  });

  describe('Element Operators', () => {
    it('whereExists() adds $exists condition with default true', () => {
      const query = builder.whereExists('name').build();
      expect(query).toEqual({ name: { $exists: true } });
    });

    it('whereExists() adds $exists condition with false', () => {
      const query = builder.whereExists('name', false).build();
      expect(query).toEqual({ name: { $exists: false } });
    });

    it('whereType() adds $type condition', () => {
      const query = builder.whereType('age', 'number').build();
      expect(query).toEqual({ age: { $type: 'number' } });
    });
  });

  describe('Array Operators', () => {
    it('whereAll() adds $all condition', () => {
      const query = builder.whereAll('tags', ['typescript', 'nodejs']).build();
      expect(query).toEqual({ tags: { $all: ['typescript', 'nodejs'] } });
    });

    it('whereSize() adds $size condition', () => {
      const query = builder.whereSize('tags', 3).build();
      expect(query).toEqual({ tags: { $size: 3 } });
    });

    it('whereElemMatch() adds $elemMatch condition', () => {
      const query = builder.whereElemMatch('tags', { value: 'test' }).build();
      expect(query).toEqual({ tags: { $elemMatch: { value: 'test' } } });
    });
  });

  describe('String/Regex Operators', () => {
    it('search() adds regex with default case-insensitive option', () => {
      const query = builder.search('name', 'john').build();
      expect(query).toEqual({ name: { $regex: 'john', $options: 'i' } });
    });

    it('search() adds regex with custom options', () => {
      const query = builder.search('name', 'john', 'im').build();
      expect(query).toEqual({ name: { $regex: 'john', $options: 'im' } });
    });

    it('whereRegex() adds regex without options', () => {
      const query = builder.whereRegex('name', '^John').build();
      expect(query).toEqual({ name: { $regex: '^John' } });
    });

    it('whereRegex() adds regex with options', () => {
      const query = builder.whereRegex('name', '^John', 'i').build();
      expect(query).toEqual({ name: { $regex: '^John', $options: 'i' } });
    });
  });

  describe('Logical Operators', () => {
    it('or() adds $or condition', () => {
      const query = builder.or([{ name: 'John' }, { name: 'Jane' }]).build();
      expect(query).toEqual({ $or: [{ name: 'John' }, { name: 'Jane' }] });
    });

    it('and() adds $and condition', () => {
      const query = builder
        .and([{ age: { $gte: 18 } }, { status: 'active' }])
        .build();
      expect(query).toEqual({
        $and: [{ age: { $gte: 18 } }, { status: 'active' }],
      });
    });

    it('nor() adds $nor condition', () => {
      const query = builder
        .nor([{ status: 'deleted' }, { status: 'banned' }])
        .build();
      expect(query).toEqual({
        $nor: [{ status: 'deleted' }, { status: 'banned' }],
      });
    });

    it('not() adds $not condition', () => {
      const query = builder.not('age', { $gt: 100 }).build();
      expect(query).toEqual({ age: { $not: { $gt: 100 } } });
    });
  });

  describe('Evaluation Operators', () => {
    it('whereMod() adds $mod condition', () => {
      const query = builder.whereMod('age', 10, 0).build();
      expect(query).toEqual({ age: { $mod: [10, 0] } });
    });

    it('whereExpr() adds $expr condition', () => {
      const query = builder.whereExpr({ $gt: ['$age', '$minAge'] }).build();
      expect(query).toEqual({ $expr: { $gt: ['$age', '$minAge'] } });
    });
  });

  describe('Geospatial Operators', () => {
    it('whereNear() adds $near condition without distances', () => {
      const query = builder.whereNear('location', [40.7128, -74.006]).build();
      expect(query).toEqual({
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [40.7128, -74.006] },
          },
        },
      });
    });

    it('whereNear() adds $near condition with maxDistance', () => {
      const query = builder
        .whereNear('location', [40.7128, -74.006], 1000)
        .build();
      expect(query).toEqual({
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [40.7128, -74.006] },
            $maxDistance: 1000,
          },
        },
      });
    });

    it('whereNear() adds $near condition with both distances', () => {
      const query = builder
        .whereNear('location', [40.7128, -74.006], 1000, 100)
        .build();
      expect(query).toEqual({
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [40.7128, -74.006] },
            $maxDistance: 1000,
            $minDistance: 100,
          },
        },
      });
    });

    it('whereGeoWithin() adds $geoWithin condition', () => {
      const polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0],
          ],
        ],
      };
      const query = builder.whereGeoWithin('location', polygon).build();
      expect(query).toEqual({
        location: { $geoWithin: { $geometry: polygon } },
      });
    });
  });

  describe('Utility Methods', () => {
    it('raw() merges raw query object', () => {
      const query = builder
        .where('name', 'John')
        .raw({ customField: { $exists: true } })
        .build();
      expect(query).toEqual({
        name: 'John',
        customField: { $exists: true },
      });
    });

    it('build() returns the constructed query', () => {
      builder.where('name', 'John').whereGreaterThan('age', 18);
      const query = builder.build();
      expect(query).toEqual({ name: 'John', age: { $gt: 18 } });
    });

    it('reset() clears the query', () => {
      builder.where('name', 'John');
      builder.reset();
      expect(builder.build()).toEqual({});
    });
  });

  describe('Chaining', () => {
    it('supports method chaining', () => {
      const query = builder
        .where('status', 'active')
        .whereGreaterThan('age', 18)
        .whereLessThan('age', 65)
        .whereIn('role', ['user', 'admin'])
        .build();

      expect(query).toEqual({
        status: 'active',
        age: { $lt: 65 }, // Note: last condition on same field wins
        role: { $in: ['user', 'admin'] },
      });
    });

    it('reset() returns this for chaining', () => {
      const query = builder
        .where('old', 'value')
        .reset()
        .where('new', 'value')
        .build();

      expect(query).toEqual({ new: 'value' });
    });
  });
});
