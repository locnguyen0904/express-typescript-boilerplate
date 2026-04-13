type MongoosePlugin<TOptions = unknown> = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: any,
  options?: TOptions
) => void;

/**
 * Type-safe helper to apply Mongoose plugins.
 * Accepts any Schema type to work with custom models.
 *
 * @param schema - Mongoose schema (any type to support custom models)
 * @param plugin - Plugin function
 * @param options - Plugin options (optional)
 */
export const applyPlugin = <TOptions = unknown>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: any,
  plugin: MongoosePlugin<TOptions>,
  options?: TOptions
): void => {
  schema.plugin(plugin, options);
};
