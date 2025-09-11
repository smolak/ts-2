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
      }
    ],
    actions: function (data) {
      const actions: PlopTypes.ActionConfig[] = [];
      const packageName = `@repo/${data.name}`;
      const workspacePath = data.type === 'app' ? 'apps' : 'packages';
      
      // Create package.json
      actions.push({
        type: 'add',
        path: `${workspacePath}/{{kebabCase name}}/package.json`,
        templateFile: 'plop-templates/package.json.hbs',
        data: {
          packageName: packageName,
          type: data.type
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

      // Create tsconfig.json for packages
      if (data.type === 'package') {
        actions.push({
          type: 'add',
          path: `${workspacePath}/{{kebabCase name}}/tsconfig.json`,
          templateFile: 'plop-templates/tsconfig.json.hbs'
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
