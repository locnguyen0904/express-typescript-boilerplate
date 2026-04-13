export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type rules
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation only
        'style', // Code style (formatting, semicolons, etc.)
        'refactor', // Code refactoring (no feature/fix)
        'perf', // Performance improvements
        'test', // Adding/updating tests
        'build', // Build system or dependencies
        'ci', // CI/CD configuration
        'chore', // Maintenance tasks
        'revert', // Revert previous commit
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],

    // Scope rules
    'scope-case': [2, 'always', 'lower-case'],
    'scope-enum': [
      1, // Warning only - allow flexibility
      'always',
      [
        'api',
        'auth',
        'config',
        'core',
        'db',
        'deps',
        'docker',
        'jobs',
        'middleware',
        'test',
        'docs',
        'redis',
      ],
    ],

    // Subject rules
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-max-length': [2, 'always', 72], // Best practice: 72 chars for subject

    // Header rules
    'header-max-length': [2, 'always', 100],
    'header-min-length': [2, 'always', 10],

    // Body rules
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'always', 100],

    // Footer rules
    'footer-leading-blank': [2, 'always'],
    'footer-max-line-length': [2, 'always', 100],
  },
  prompt: {
    questions: {
      type: {
        description: 'Select the type of change:',
        enum: {
          feat: { description: '✨ A new feature', title: 'Features' },
          fix: { description: '🐛 A bug fix', title: 'Bug Fixes' },
          docs: {
            description: '📚 Documentation only',
            title: 'Documentation',
          },
          style: { description: '💎 Code style (formatting)', title: 'Styles' },
          refactor: {
            description: '📦 Code refactoring',
            title: 'Code Refactoring',
          },
          perf: {
            description: '🚀 Performance improvements',
            title: 'Performance',
          },
          test: { description: '🧪 Adding/updating tests', title: 'Tests' },
          build: {
            description: '🛠 Build system/dependencies',
            title: 'Build',
          },
          ci: { description: '⚙️ CI/CD configuration', title: 'CI' },
          chore: { description: '♻️ Maintenance tasks', title: 'Chores' },
          revert: {
            description: '🗑 Revert previous commit',
            title: 'Reverts',
          },
        },
      },
      scope: {
        description: 'Scope of the change (optional):',
      },
      subject: {
        description: 'Short description (imperative, lowercase, no period):',
      },
      body: {
        description: 'Longer description (optional):',
      },
      isBreaking: {
        description: 'Are there any breaking changes?',
      },
      issues: {
        description: 'Issues this commit closes (e.g., #123):',
      },
    },
  },
};
