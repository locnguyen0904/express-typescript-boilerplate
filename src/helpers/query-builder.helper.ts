export default class QueryBuilder<T> {
  private query: Record<string, unknown> = {};

  // Comparison Operators
  where(field: keyof T | string, value: unknown): this {
    this.query[field as string] = value;
    return this;
  }

  whereNot(field: keyof T | string, value: unknown): this {
    this.query[field as string] = { $ne: value };
    return this;
  }

  whereIn(field: keyof T | string, values: unknown[]): this {
    this.query[field as string] = { $in: values };
    return this;
  }

  whereNotIn(field: keyof T | string, values: unknown[]): this {
    this.query[field as string] = { $nin: values };
    return this;
  }

  whereGreaterThan(field: keyof T | string, value: unknown): this {
    this.query[field as string] = { $gt: value };
    return this;
  }

  whereGreaterThanOrEqual(field: keyof T | string, value: unknown): this {
    this.query[field as string] = { $gte: value };
    return this;
  }

  whereLessThan(field: keyof T | string, value: unknown): this {
    this.query[field as string] = { $lt: value };
    return this;
  }

  whereLessThanOrEqual(field: keyof T | string, value: unknown): this {
    this.query[field as string] = { $lte: value };
    return this;
  }

  whereBetween(field: keyof T | string, min: unknown, max: unknown): this {
    this.query[field as string] = { $gte: min, $lte: max };
    return this;
  }

  // Element Operators
  whereExists(field: keyof T | string, exists = true): this {
    this.query[field as string] = { $exists: exists };
    return this;
  }

  whereType(field: keyof T | string, type: string | number): this {
    this.query[field as string] = { $type: type };
    return this;
  }

  // Array Operators
  whereAll(field: keyof T | string, values: unknown[]): this {
    this.query[field as string] = { $all: values };
    return this;
  }

  whereSize(field: keyof T | string, size: number): this {
    this.query[field as string] = { $size: size };
    return this;
  }

  whereElemMatch(
    field: keyof T | string,
    condition: Record<string, unknown>
  ): this {
    this.query[field as string] = { $elemMatch: condition };
    return this;
  }

  // String/Regex Operators
  search(field: keyof T | string, term: string, options = 'i'): this {
    this.query[field as string] = { $regex: term, $options: options };
    return this;
  }

  whereRegex(
    field: keyof T | string,
    pattern: string | RegExp,
    options?: string
  ): this {
    this.query[field as string] = options
      ? { $regex: pattern, $options: options }
      : { $regex: pattern };
    return this;
  }

  // Logical Operators
  or(conditions: Record<string, unknown>[]): this {
    this.query.$or = conditions;
    return this;
  }

  and(conditions: Record<string, unknown>[]): this {
    this.query.$and = conditions;
    return this;
  }

  nor(conditions: Record<string, unknown>[]): this {
    this.query.$nor = conditions;
    return this;
  }

  not(field: keyof T | string, condition: Record<string, unknown>): this {
    this.query[field as string] = { $not: condition };
    return this;
  }

  // Evaluation Operators
  whereMod(field: keyof T | string, divisor: number, remainder: number): this {
    this.query[field as string] = { $mod: [divisor, remainder] };
    return this;
  }

  whereExpr(expression: Record<string, unknown>): this {
    this.query.$expr = expression;
    return this;
  }

  // Geospatial Operators
  whereNear(
    field: keyof T | string,
    coordinates: [number, number],
    maxDistance?: number,
    minDistance?: number
  ): this {
    const near: Record<string, unknown> = {
      $geometry: { type: 'Point', coordinates },
    };
    if (maxDistance !== undefined) near.$maxDistance = maxDistance;
    if (minDistance !== undefined) near.$minDistance = minDistance;
    this.query[field as string] = { $near: near };
    return this;
  }

  whereGeoWithin(
    field: keyof T | string,
    geometry: Record<string, unknown>
  ): this {
    this.query[field as string] = { $geoWithin: { $geometry: geometry } };
    return this;
  }

  // Utility Methods
  raw(query: Record<string, unknown>): this {
    this.query = { ...this.query, ...query };
    return this;
  }

  build(): Record<string, unknown> {
    return this.query;
  }

  reset(): this {
    this.query = {};
    return this;
  }
}
