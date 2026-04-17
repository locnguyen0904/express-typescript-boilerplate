describe('Feature flag config', () => {
  const originalEnv = process.env;

  const loadConfig = () => {
    jest.resetModules();

    let config: (typeof import('@/config/env.config'))['default'];

    jest.isolateModules(() => {
      config = jest.requireActual('@/config/env.config').default;
    });

    return config!;
  };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgresql://localhost:5432/test',
      JWT_SECRET: '12345678901234567890123456789012',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('parses CACHE_ENABLED=false as boolean false', () => {
    process.env.CACHE_ENABLED = 'false';

    const config = loadConfig();

    expect(config.redis.enabled).toBe(false);
  });

  it('parses JOBS_ENABLED=false as boolean false', () => {
    process.env.JOBS_ENABLED = 'false';

    const config = loadConfig();

    expect(config.features.jobsEnabled).toBe(false);
  });

  it('defaults CACHE_ENABLED and JOBS_ENABLED to true when omitted', () => {
    delete process.env.CACHE_ENABLED;
    delete process.env.JOBS_ENABLED;

    const config = loadConfig();

    expect(config.redis.enabled).toBe(true);
    expect(config.features.jobsEnabled).toBe(true);
  });

  it('does not provide default Bull Board credentials when omitted', () => {
    delete process.env.BULL_BOARD_USERNAME;
    delete process.env.BULL_BOARD_PASSWORD;

    const config = loadConfig();

    expect(config.bullBoard.username).toBeUndefined();
    expect(config.bullBoard.password).toBeUndefined();
  });
});
