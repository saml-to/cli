import {
  GithubSlsRestApiConfigV20220101,
  GithubSlsRestApiNameIdFormatV1,
} from '../../api/github-sls-rest-api';
import inquirer from 'inquirer';
import { ui } from '../command';
import { Show } from './show';
import { load } from 'js-yaml';
import { CONFIG_FILE } from './init';
import { ConfigHelper } from '../helpers/configHelper';
import { OrgHelper } from '../helpers/orgHelper';
import { GenericHelper } from '../helpers/genericHelper';
import { MessagesHelper } from '../helpers/messagesHelper';

export type AddSubcommands = 'provider' | 'permission';

export type AddNameIdFormats = GithubSlsRestApiNameIdFormatV1 | 'none';

export type AddAttributes = { [key: string]: string };

export class Add {
  show: Show;

  configHelper: ConfigHelper;

  orgHelper: OrgHelper;

  genericHelper: GenericHelper;

  constructor(private messagesHelper: MessagesHelper) {
    this.show = new Show();
    this.configHelper = new ConfigHelper();
    this.orgHelper = new OrgHelper();
    this.genericHelper = new GenericHelper(messagesHelper);
  }

  public async handle(
    subcommand: AddSubcommands,
    name?: string,
    entityId?: string,
    acsUrl?: string,
    loginUrl?: string,
    nameId?: string,
    nameIdFormat?: AddNameIdFormats,
    role?: string,
    attributes?: { [key: string]: string },
  ): Promise<void> {
    switch (subcommand) {
      case 'provider': {
        const added = await this.addProvider(
          name,
          entityId,
          acsUrl,
          loginUrl,
          nameId,
          nameIdFormat,
          role,
          attributes,
        );
        if (added) {
          this.messagesHelper.providerAdded();
        }
        break;
      }
      case 'permission': {
        const added = await this.addPermission();
        if (added) {
          console.log(`
Permissions have been granted!`);
        }
        break;
      }
      default:
        throw new Error(`Unknown subcommand: ${subcommand}`);
    }
  }

  private async addProvider(
    name?: string,
    entityId?: string,
    acsUrl?: string,
    loginUrl?: string,
    nameId?: string,
    nameIdFormat?: AddNameIdFormats,
    role?: string,
    attributes?: { [key: string]: string },
  ): Promise<boolean> {
    const { org, repo } = await this.orgHelper.promptOrg('manage');

    ui.updateBottomBar('Fetching config...');

    const configYaml = await this.configHelper.fetchConfigYaml(org, true);

    const config = load(configYaml) as { version: string };

    if (!config.version) {
      throw new Error(`Missing version in config`);
    }

    const added = await this.genericHelper.promptProvider(
      org,
      repo,
      config,
      name,
      entityId,
      acsUrl,
      loginUrl,
      nameId,
      nameIdFormat,
      role,
      attributes,
    );

    if (added) {
      await this.configHelper.fetchConfigYaml(org);

      ui.updateBottomBar('');
      console.log('Configuration is valid!');
    }
    return added;
  }

  private async addPermission(): Promise<boolean> {
    const { org, repo } = await this.orgHelper.promptOrg('manage');

    const configYaml = await this.configHelper.fetchConfigYaml(org, true);

    const config = load(configYaml) as { version: string };

    if (!config.version) {
      throw new Error(`Missing version in config`);
    }

    let added = false;
    switch (config.version) {
      case '20220101': {
        added = await this.addPermissionV20220101(
          org,
          repo,
          config as GithubSlsRestApiConfigV20220101,
        );
        break;
      }
      default:
        throw new Error(`Invalid config version: ${config.version}`);
    }

    if (added) {
      await this.configHelper.fetchConfigYaml(org);

      ui.updateBottomBar('');
      console.log('Configuration is valid!');
    }

    return added;
  }

  private async addPermissionV20220101(
    org: string,
    repo: string,
    config: GithubSlsRestApiConfigV20220101,
  ): Promise<boolean> {
    if (!config.providers || !Object.keys(config.providers).length) {
      throw new Error(
        `There are no \`providers\` in the in \`${org}/${repo}/${CONFIG_FILE}\`. Add a provider first using the \`add provider\` command`,
      );
    }

    ui.updateBottomBar('');
    const providerKey: string = (
      await inquirer.prompt({
        type: 'list',
        name: 'providerKey',
        message: `For which provider would you like to grant user permission?`,
        choices: Object.keys(config.providers).map((k) => {
          return { name: k, value: k };
        }),
      })
    ).providerKey;

    const permissions = (config.permissions && config.permissions[providerKey]) || {};

    if (permissions.roles && permissions.users) {
      throw new Error(
        `This utility doesn't currently support adding permissions to providers that have roles and users. Please edit the configuration manually:

permissions:
  TheProviderName:
    users:
      github:
        - AGithubId
    roles:
      name: TheRoleName
      users:
        github:
          - AGithubID`,
      );
    }

    let type: 'role-user' | 'sso-user';
    if (!permissions.roles && !permissions.users) {
      type = await this.genericHelper.promptLoginType();
    } else {
      if (permissions.roles) {
        type = 'role-user';
      } else {
        type = 'sso-user';
      }
    }

    if (type === 'role-user') {
      return this.genericHelper.promptRolePermissionV20220101(org, repo, providerKey, config);
    } else {
      return this.genericHelper.promptPermissionV20220101(org, repo, providerKey, config);
    }
  }
}
