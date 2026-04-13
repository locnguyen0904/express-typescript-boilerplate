import { Schema } from 'mongoose';

import { applyPlugin } from '@/helpers/mongoose-plugin.helper';

describe('MongoosePluginHelper', () => {
  it('should apply a plugin to a schema with options', () => {
    // Mock Schema
    const mockSchema = {
      plugin: jest.fn(),
    } as unknown as Schema;

    const mockPlugin = jest.fn();
    const mockOptions = { option1: true };

    applyPlugin(mockSchema, mockPlugin, mockOptions);

    expect(mockSchema.plugin).toHaveBeenCalledWith(mockPlugin, mockOptions);
  });

  it('should apply a plugin without options', () => {
    const mockSchema = {
      plugin: jest.fn(),
    } as unknown as Schema;

    const mockPlugin = jest.fn();

    applyPlugin(mockSchema, mockPlugin);

    expect(mockSchema.plugin).toHaveBeenCalledWith(mockPlugin, undefined);
  });
});
