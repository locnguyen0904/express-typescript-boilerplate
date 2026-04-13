/** @type {import('plop').NodePlopAPI} */
export default function (plop) {
  plop.setGenerator('module', {
    description: 'Generate a new API module (CSRM pattern)',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Resource name (singular, e.g. "product"):',
        validate: (value) => {
          if (!value || !value.trim()) return 'Resource name is required';
          if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(value))
            return 'Resource name must start with a letter and contain only letters, numbers, or hyphens';
          return true;
        },
      },
    ],
    actions: [
      // Model
      {
        type: 'add',
        path: 'src/api/{{kebabCase name}}/{{kebabCase name}}.model.ts',
        templateFile: 'plop-templates/model.ts.hbs',
      },
      // Repository
      {
        type: 'add',
        path: 'src/api/{{kebabCase name}}/{{kebabCase name}}.repository.ts',
        templateFile: 'plop-templates/repository.ts.hbs',
      },
      // Service
      {
        type: 'add',
        path: 'src/api/{{kebabCase name}}/{{kebabCase name}}.service.ts',
        templateFile: 'plop-templates/service.ts.hbs',
      },
      // Controller
      {
        type: 'add',
        path: 'src/api/{{kebabCase name}}/{{kebabCase name}}.controller.ts',
        templateFile: 'plop-templates/controller.ts.hbs',
      },
      // Validation
      {
        type: 'add',
        path: 'src/api/{{kebabCase name}}/{{kebabCase name}}.validation.ts',
        templateFile: 'plop-templates/validation.ts.hbs',
      },
      // OpenAPI Docs
      {
        type: 'add',
        path: 'src/api/{{kebabCase name}}/{{kebabCase name}}.doc.ts',
        templateFile: 'plop-templates/doc.ts.hbs',
      },
      // Routes (index.ts)
      {
        type: 'add',
        path: 'src/api/{{kebabCase name}}/index.ts',
        templateFile: 'plop-templates/routes.ts.hbs',
      },
      // Test
      {
        type: 'add',
        path: 'src/__tests__/api/{{kebabCase name}}/{{kebabCase name}}.service.test.ts',
        templateFile: 'plop-templates/test.ts.hbs',
      },
      // Register route in api/index.ts
      {
        type: 'append',
        path: 'src/api/index.ts',
        pattern: /import health from '.\/health';/,
        template: "import {{camelCase name}} from './{{kebabCase name}}';",
      },
      {
        type: 'append',
        path: 'src/api/index.ts',
        pattern: /router\.use\('\/health', health\);/,
        template: "router.use('/{{kebabCase name}}s', {{camelCase name}});",
      },
    ],
  });
}
