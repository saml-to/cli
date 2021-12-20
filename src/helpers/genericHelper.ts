import {
  GithubSlsRestApiConfigV20211212,
  GithubSlsRestApiVariableV1,
  GithubSlsRestApiProviderV1,
} from '../../api/github-sls-rest-api';
import inquirer from 'inquirer';
import { ui } from '../command';
import { ConfigHelper } from './configHelper';

export const trainCase = (str: string): string => {
  if (!str) {
    return '';
  }

  const match = str.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g);

  if (!match) {
    return '';
  }

  return match.map((x) => x.toLowerCase()).join('-');
};

export class GenericHelper {
  configHelper: ConfigHelper;

  constructor() {
    this.configHelper = new ConfigHelper();
  }

  public async promptUsers(
    provider: string,
    role?: string,
    users: string[] = [],
  ): Promise<string[]> {
    const { user } = await inquirer.prompt({
      type: 'input',
      name: 'user',
      message: `What is the Github ID of the user that will be allowed to ${
        role ? `assume \`${role}\`` : `login to ${provider}`
      }? (Leave blank if finished adding users)
`,
    });

    if (!user) {
      return users;
    }

    users.push(user);

    return this.promptUsers(provider, role, users);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any
  async promptProvider(org: string, repo: string, config: any): Promise<boolean> {
    ui.updateBottomBar('');
    const { name } = await inquirer.prompt({
      type: 'input',
      name: 'name',
      message: `What is the name of the provider?`,
    });

    switch (config.version) {
      case '20211212':
        return this.promptProviderV20211212(
          trainCase(name),
          org,
          repo,
          config as GithubSlsRestApiConfigV20211212,
        );
      default:
        throw new Error(`Unknown version ${config.version}`);
    }
  }

  private async promptProviderV20211212(
    name: string,
    org: string,
    repo: string,
    config: GithubSlsRestApiConfigV20211212,
  ): Promise<boolean> {
    if (config.providers && config.providers[name]) {
      throw new Error(
        `An provider named \`${name}\` already exists, please manually edit the configuration to add another`,
      );
    }

    ui.updateBottomBar('');
    const { acsUrl } = await inquirer.prompt({
      type: 'input',
      name: 'acsUrl',
      message: `What is the Assertion Consumer Service (ACS) URL for ${name}?`,
    });

    const { entityId } = await inquirer.prompt({
      type: 'input',
      name: 'entityId',
      message: `What is the Entity ID for ${name}?`,
    });

    const { audience } = await inquirer.prompt({
      type: 'input',
      name: 'audience',
      message: `What is the Audience of the ${name}?`,
    });

    const { nameId } = await inquirer.prompt({
      type: 'list',
      name: 'nameId',
      message: `What format should be used for Name ID?`,
      choices: [
        { name: 'Email Address', value: '<#= user.github.email #>' },
        { name: 'Github Login/Username', value: '<#= user.github.login #>' },
        { name: 'Github User ID', value: '<#= user.github.id #>' },
      ],
    });

    const attributes = await this.promptAttributes(config.variables || {});

    const newProvider: { [key: string]: GithubSlsRestApiProviderV1 } = {
      [`${name}`]: {
        audience: `${audience}`,
        acs: `${acsUrl}`,
        issuer: `${entityId}`,
        nameId: `${nameId}`,
        attributes,
      },
    };

    // TODO: Prompt variables
    // TODO: Prompt permissions
    config.providers = { ...(config.providers || {}), ...newProvider };

    return this.configHelper.promptConfigUpdate(org, repo, config, `add ${name} provider`);
  }

  outputEnv(
    vars: { [key: string]: string },
    platform: NodeJS.Platform | 'github' = process.platform,
  ): void {
    let prefix = 'export';
    let separator = '=';
    switch (platform) {
      case 'win32':
        prefix = 'setx';
        break;
      case 'github':
        prefix = '::set-output';
        separator = '::';
        break;
      default:
        break;
    }

    Object.entries(vars).forEach(([key, value]) => {
      console.log(`${prefix} ${key}${separator}"${value}"`);
    });
  }

  public async promptAttributes(
    variables: { [key: string]: GithubSlsRestApiVariableV1 },
    attributes: { [key: string]: string } = {},
  ): Promise<{ [key: string]: string }> {
    const { attributeName } = await inquirer.prompt({
      type: 'input',
      name: 'attributeName',
      message: `What is the name of an attribute should be sent to the Provider? (Leave blank if finished adding attributes)
`,
    });

    if (!attributeName) {
      return attributes;
    }

    let { attributeValue } = await inquirer.prompt({
      type: 'list',
      name: 'attributeValue',
      message: `What should be the value of \`${attributeName}\`?
`,
      choices: [
        {
          name: 'Github User ID',
          value: '<#= user.github.id #>',
        },
        {
          name: 'Github Login/Username',
          value: '<#= user.github.login #>',
        },
        {
          name: 'Email Address',
          value: '<#= user.github.email #>',
        },
        {
          name: 'The selected role (for `assume` commands)',
          value: '<#= selectedRole #>',
        },
        {
          name: 'Session ID (randomly generated for each login)',
          value: '<#= sessionId #>',
        },
        ...Object.keys(variables).map((k) => {
          return { name: `Variable: ${k}`, value: `<$= ${k} $>` };
        }),
        { name: 'Other', value: '*_*_*_OTHER_*_*_*' },
      ],
    });

    if (attributeValue === '*_*_*_OTHER_*_*_*') {
      const { customValue } = await inquirer.prompt({
        type: 'input',
        name: 'customValue',
        message: `What is the custom value of ${attributeName}?
`,
      });

      attributeValue = customValue;
    }

    attributes[attributeName] = attributeValue;

    return this.promptAttributes(variables, attributes);
  }
}
