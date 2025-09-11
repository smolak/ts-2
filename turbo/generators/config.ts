import type { PlopTypes } from "@turbo/gen";

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  // Add Handlebars helpers
  plop.setHelper('eq', function (a, b) {
    return a === b;
  });

  plop.setGenerator('workspace', {
    description: 'Create a new workspace with @repo prefix',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Workspace name (without @repo prefix):',
        validate: function (value) {
          if (!value) {
            return 'Workspace name is required';
          }
          if (!/^[a-z0-9-]+$/.test(value)) {
            return 'Workspace name must contain only lowercase letters, numbers, and hyphens';
          }
          return true;
        }
      },
      {
        type: 'list',
        name: 'type',
        message: 'What type of workspace?',
        choices: [
          { name: 'Package', value: 'package' },
          { name: 'App', value: 'app' }
        ],
        default: 'package'
      },
      {
        type: 'confirm',
        name: 'hasTests',
        message: 'Will this workspace include tests?',
        default: true
      }
    ],
    actions: function (data) {
      if (!data) {
        return [];
      }
      
      const actions: any[] = [];
      const packageName = `@repo/${data.name}`;
      const workspacePath = data.type === 'app' ? 'apps' : 'packages';
      
      // Create package.json
      actions.push({
        type: 'add',
        path: `${workspacePath}/{{kebabCase name}}/package.json`,
        templateFile: 'plop-templates/package.json.hbs',
        data: {
          packageName: packageName,
          type: data.type,
          isTestPackage: data.hasTests || false
        }
      });

      // Create README.md
      actions.push({
        type: 'add',
        path: `${workspacePath}/{{kebabCase name}}/README.md`,
        templateFile: 'plop-templates/README.md.hbs',
        data: {
          packageName: packageName,
          displayName: data.name
        }
      });

      // Create tsconfig.json for both packages and apps
      actions.push({
        type: 'add',
        path: `${workspacePath}/{{kebabCase name}}/tsconfig.json`,
        templateFile: 'plop-templates/tsconfig.json.hbs',
        data: {
          isTestPackage: data.hasTests || false
        }
      });

      // Create vitest.config.ts for packages with tests
      if (data.hasTests) {
        actions.push({
          type: 'add',
          path: `${workspacePath}/{{kebabCase name}}/vitest.config.ts`,
          templateFile: 'plop-templates/vitest.config.ts.hbs'
        });
      }

      // Create src folder with index file
      actions.push({
        type: 'add',
        path: `${workspacePath}/{{kebabCase name}}/src/index.ts`,
        templateFile: 'plop-templates/index.ts.hbs',
        data: {
          packageName: packageName,
          displayName: data.name
        }
      });

      return actions;
    }
  });
}
