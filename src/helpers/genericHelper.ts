import {
  GithubSlsRestApiConfigV20220101,
  GithubSlsRestApiVariableV1,
  GithubSlsRestApiProviderV1,
  GithubSlsRestApiNameIdFormatV1,
} from '../../api/github-sls-rest-api';
import inquirer from 'inquirer';
import { ui } from '../command';
import { ConfigHelper } from './configHelper';
import { Scms } from '../stores/scms';
import { AddNameIdFormats } from '../commands/add';
import { Show } from '../commands/show';
import { MessagesHelper } from './messagesHelper';
import { CONFIG_FILE } from '../commands/init';

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

  scms: Scms;

  show: Show;

  constructor(private messagesHelper: MessagesHelper) {
    this.configHelper = new ConfigHelper();
    this.scms = new Scms();
    this.show = new Show();
  }

  public async promptUsers(provider: string, role?: string, users?: string[]): Promise<string[]> {
    if (!users) {
      ui.updateBottomBar('');
      const { addSelf } = await inquirer.prompt({
        type: 'confirm',
        name: 'addSelf',
        message: `Would you like to grant yourself access to ${
          role ? `assume \`${role}\`` : `login to ${provider}`
        }?
  `,
      });

      if (addSelf) {
        const login = await this.scms.getLogin();
        users = [login];
      } else {
        users = [];
      }
    }

    ui.updateBottomBar('');
    const { user } = await inquirer.prompt({
      type: 'input',
      name: 'user',
      message: `What is another Github ID of the user that will be allowed to ${
        role ? `assume \`${role}\`` : `login to ${provider}`
      }? (Leave blank if finished adding users)
`,
    });

    if (!user) {
      return users || [];
    }

    users.push(user);

    return [...new Set(await this.promptUsers(provider, role, users))];
  }

  async promptProvider(
    org: string,
    repo: string,
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any
    config: any,
    name?: string,
    entityId?: string,
    acsUrl?: string,
    loginUrl?: string,
    nameId?: string,
    nameIdFormat?: AddNameIdFormats,
    role?: string,
    attributes?: { [key: string]: string },
  ): Promise<boolean> {
    ui.updateBottomBar('');
    if (!name) {
      name = (
        await inquirer.prompt({
          type: 'input',
          name: 'name',
          message: `What is the name of the provider (e.g. AWS, Slack, Google)?`,
        })
      ).name;
    }

    if (!name) {
      throw new Error('Name is required');
    }

    this.messagesHelper.context.provider = name;

    switch (config.version) {
      case '20220101':
        return this.promptProviderV20220101(
          trainCase(name),
          org,
          repo,
          config as GithubSlsRestApiConfigV20220101,
          entityId,
          acsUrl,
          loginUrl,
          nameId,
          nameIdFormat,
          role,
          attributes,
        );
      default:
        throw new Error(`Unknown version ${config.version}`);
    }
  }

  private async promptProviderV20220101(
    name: string,
    org: string,
    repo: string,
    config: GithubSlsRestApiConfigV20220101,
    entityId?: string,
    acsUrl?: string,
    loginUrl?: string,
    nameId?: string,
    nameIdFormat?: AddNameIdFormats,
    role?: string,
    attributes?: { [key: string]: string },
  ): Promise<boolean> {
    if (config.providers && config.providers[name]) {
      throw new Error(
        `An provider named \`${name}\` already exists, please manually edit the configuration to add another`,
      );
    }

    let cliProvidedInputs = false;
    if (entityId && acsUrl) {
      cliProvidedInputs = true;
    }

    ui.updateBottomBar('');
    if (!entityId) {
      entityId = (
        await inquirer.prompt({
          type: 'input',
          name: 'entityId',
          message: `What is the Entity ID for ${name}?`,
        })
      ).entityId;
    }

    if (!acsUrl) {
      acsUrl = (
        await inquirer.prompt({
          type: 'input',
          name: 'acsUrl',
          message: `What is the Assertion Consumer Service (ACS) URL for ${name}?`,
        })
      ).acsUrl;
    }

    if (!loginUrl && loginUrl !== 'NONE') {
      const { initiation } = await inquirer.prompt({
        type: 'list',
        name: 'initiation',
        message: `How are SAML login requests initiated?`,
        default: 'sp',
        choices: [
          {
            name: 'By the Service Provider ("SP-Initiated")',
            value: 'sp',
          },
          {
            name: 'By the Identity Provider ("IdP-Initiated")',
            value: 'ip',
          },
          {
            name: "I don't know",
            value: 'dunno',
          },
        ],
      });

      if (initiation === 'dunno') {
        this.messagesHelper.unknownInitiation(name, CONFIG_FILE);
      } else if (initiation === 'sp') {
        loginUrl = (
          await inquirer.prompt({
            type: 'input',
            name: 'loginUrl',
            message: `What is the Login URL for ${name}?`,
          })
        ).loginUrl;
      }
    }

    if (loginUrl === 'NONE') {
      loginUrl = undefined;
    }

    if (!nameIdFormat) {
      nameIdFormat = (
        await inquirer.prompt({
          type: 'list',
          name: 'nameIdFormat',
          message: `(Optional) Does the provider need Name IDs in a particular format?
  `,
          choices: [
            {
              name: 'Persistent (GitHub User ID)',
              value: 'id',
            },
            {
              name: 'Transient (Github Login/Username)',
              value: 'login',
            },
            {
              name: 'Email (GitHub User Email)',
              value: 'email',
            },
            { name: 'None', value: 'none' },
          ],
        })
      ).nameIdFormat;
    }

    // TODO Prompt for certificate

    let idFormat: GithubSlsRestApiNameIdFormatV1 | undefined;
    if (nameIdFormat && nameIdFormat !== 'none') {
      idFormat = nameIdFormat as GithubSlsRestApiNameIdFormatV1;
    }

    if (!attributes || Object.keys(attributes).length === 0) {
      attributes = await this.promptAttributes(config.variables || {});
    }

    const newProvider: { [key: string]: GithubSlsRestApiProviderV1 } = {
      [`${name}`]: {
        entityId,
        loginUrl,
        nameId,
        nameIdFormat: idFormat,
        acsUrl,
        attributes,
      },
    };

    config.providers = { ...(config.providers || {}), ...newProvider };

    this.configHelper.dumpConfig(org, repo, config, true);

    const { addPermissions } = await inquirer.prompt({
      type: 'confirm',
      name: 'addPermissions',
      message: `Would you like to grant any permissions to GitHub users now?`,
    });

    if (!addPermissions) {
      return this.configHelper.promptConfigUpdate(
        org,
        repo,
        config,
        `${name}: add provider`,
        false,
      );
    }

    if (!role && !cliProvidedInputs) {
      const type = await this.promptLoginType();
      this.messagesHelper.context.loginType = type;
      if (type === 'role-user') {
        return this.promptRolePermissionV20220101(org, repo, name, config, role);
      }
    }

    if (role) {
      this.messagesHelper.context.loginType = 'role-user';
      return this.promptRolePermissionV20220101(org, repo, name, config, role);
    } else {
      this.messagesHelper.context.loginType = 'sso-user';
      return this.promptPermissionV20220101(org, repo, name, config);
    }
  }

  public async promptLoginType(): Promise<'role-user' | 'sso-user'> {
    let type: 'role-user' | 'sso-user' = 'sso-user';
    type = (
      await inquirer.prompt({
        type: 'list',
        name: 'type',
        message: `Which type of permission would you like to add?`,
        default: 'sso-user',
        choices: [
          { name: 'Role assumption', value: 'role-user' },
          { name: 'Sign-in Permission (a.k.a. SSO)', value: 'sso-user' },
        ],
      })
    ).type;

    return type;
  }

  public async promptPermissionV20220101(
    org: string,
    repo: string,
    provider: string,
    config: GithubSlsRestApiConfigV20220101,
  ): Promise<boolean> {
    config.permissions = config.permissions || {};
    config.permissions[provider] = config.permissions[provider] || {};
    config.permissions[provider].users = config.permissions[provider].users || {};
    (config.permissions[provider].users || {}).github =
      (config.permissions[provider].users || {}).github || [];

    const githubLogins = await this.promptUsers(provider);

    const logins = new Set([
      ...((config.permissions[provider].users || {}).github || []),
      ...githubLogins,
    ]);

    (config.permissions[provider].users || {}).github = [...logins];

    return this.configHelper.promptConfigUpdate(
      org,
      repo,
      config,
      `${provider}: grant permissions to login

${githubLogins.map((l) => `- ${l}`)}`,
      true,
    );
  }

  public async promptRolePermissionV20220101(
    org: string,
    repo: string,
    provider: string,
    config: GithubSlsRestApiConfigV20220101,
    role?: string,
  ): Promise<boolean> {
    config.permissions = config.permissions || {};
    config.permissions[provider] = config.permissions[provider] || {};
    config.permissions[provider].roles = config.permissions[provider].roles || [];

    ui.updateBottomBar('');
    if (!role) {
      role = (
        await inquirer.prompt({
          type: 'list',
          name: 'roleName',
          message: `What is the name of the role you would like to allow for assumption?`,
          choices: [
            ...(config.permissions[provider].roles || []).map((r) => ({ name: r.name })),
            { name: 'Add a new role', value: '' },
          ],
        })
      ).roleName;

      if (!role) {
        const { input } = await inquirer.prompt({
          type: 'input',
          name: 'input',
          message: `What is name of the new role?
  `,
        });
        role = input;
      }
    }

    if (!role) {
      throw new Error('Missing role name');
    }

    const roleIx = (config.permissions[provider].roles || []).findIndex(
      (r) => role && r.name && r.name.toLowerCase() === role.toLowerCase(),
    );

    const githubLogins = await this.promptUsers(
      provider,
      role,
      ((((config.permissions[provider] || {}).roles || [])[roleIx] || {}).users || {}).github,
    );

    if (roleIx === -1) {
      (config.permissions[provider].roles || []).push({
        name: role,
        users: { github: githubLogins },
      });
    } else {
      ((((config.permissions[provider] || {}).roles || [])[roleIx] || {}).users || {}).github =
        githubLogins;
    }

    return this.configHelper.promptConfigUpdate(
      org,
      repo,
      config,
      `${provider}: grant permissions to assume ${role}

${githubLogins.map((l) => `- ${l}`)}`,
      true,
    );
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
          name: 'Full Name',
          value: '<#= user.github.fullName #>',
        },
        {
          name: 'First Name',
          value: '<#= user.github.firstName #>',
        },
        {
          name: 'Last Name',
          value: '<#= user.github.lastName #>',
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
