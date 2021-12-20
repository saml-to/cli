import {
  GithubSlsRestApiConfigV20211212,
  GithubSlsRestApiProviderV1,
} from '../../api/github-sls-rest-api';
import inquirer from 'inquirer';
import { ui } from '../command';
import { Show } from './show';
import { load } from 'js-yaml';
import { AwsHelper } from '../helpers/aws/awsHelper';
import { CONFIG_FILE } from './init';
import { ConfigHelper } from '../helpers/configHelper';
import { OrgHelper } from '../helpers/orgHelper';
import { GenericHelper } from '../helpers/genericHelper';
import { AwsSsoHelper } from '../helpers/aws/awsSsoHelper';

export type AddSubcommands = 'provider' | 'permission';

export class Add {
  show: Show;

  awsHelper: AwsHelper;

  awsSsoHelper: AwsSsoHelper;

  configHelper: ConfigHelper;

  orgHelper: OrgHelper;

  genericHelper: GenericHelper;

  constructor() {
    this.show = new Show();
    this.awsHelper = new AwsHelper();
    this.awsSsoHelper = new AwsSsoHelper();
    this.configHelper = new ConfigHelper();
    this.orgHelper = new OrgHelper();
    this.genericHelper = new GenericHelper();
  }

  public async handle(subcommand: AddSubcommands): Promise<void> {
    switch (subcommand) {
      case 'provider': {
        const added = await this.addProvider();
        if (added) {
          console.log(`
Provider has been registered!

Need to add another provider? Run the \`add provider\` command again!

Permissions can be continually added by running the \`add permission\` command.

Once permissions are added, users can login or assume roles using the following commands:
 - \`saml-to login\`
 - \`saml-to assume\``);
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

  private async addProvider(): Promise<boolean> {
    const { org, repo } = await this.orgHelper.promptOrg('manage');

    ui.updateBottomBar('Fetching config...');

    const configYaml = await this.configHelper.fetchConfigYaml(org, true);

    const config = load(configYaml) as { version: string };

    if (!config.version) {
      throw new Error(`Missing version in config`);
    }

    ui.updateBottomBar('');
    const { type } = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: `For which Service Provider would you like to add access?`,
      choices: [
        {
          name: 'AWS (Federated)',
          value: 'aws',
        },
        {
          name: 'AWS (SSO)',
          value: 'aws-sso',
        },
        { name: 'Other', value: 'other' },
      ],
    });

    let added = false;
    switch (type) {
      case 'aws': {
        added = await this.awsHelper.promptProvider(org, repo, config);
        break;
      }
      case 'aws-sso': {
        added = await this.awsSsoHelper.promptProvider(org, repo, config);
        break;
      }
      case 'other': {
        added = await this.genericHelper.promptProvider(org, repo, config);
        break;
      }
      default:
        throw new Error(`Unknown type: ${type}`);
    }

    if (added) {
      await this.configHelper.fetchConfigYaml(org);

      ui.updateBottomBar('');
      console.log('Configuration is valid!');
    }
    return added;
  }

  private async addPermission(): Promise<boolean> {
    const { org, repo } = await this.orgHelper.promptOrg('log in');

    const configYaml = await this.configHelper.fetchConfigYaml(org, true);

    const config = load(configYaml) as { version: string };

    if (!config.version) {
      throw new Error(`Missing version in config`);
    }

    let added = false;
    switch (config.version) {
      case '20211212': {
        added = await this.addPermissionV20211212(
          org,
          repo,
          config as GithubSlsRestApiConfigV20211212,
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

  private async addPermissionV20211212(
    org: string,
    repo: string,
    config: GithubSlsRestApiConfigV20211212,
  ): Promise<boolean> {
    if (!config.providers || !Object.keys(config.providers).length) {
      throw new Error(
        `There are no \`providers\` in the in \`${org}/${repo}/${CONFIG_FILE}\`. Add a provider first using the \`add provider\` command`,
      );
    }

    ui.updateBottomBar('');
    const issuer: GithubSlsRestApiProviderV1 | undefined = (
      await inquirer.prompt({
        type: 'list',
        name: 'issuer',
        message: `For which provider would you like to grant user permission?`,
        choices: Object.entries(config.providers).map(([k, c]) => {
          return { name: k, value: c.issuer };
        }),
      })
    ).issuer;

    if (issuer && (issuer as string).toLowerCase().endsWith('.amazon.com/saml')) {
      return this.awsHelper.promptPermissionV20211212(org, repo, config);
    }

    // TODO: Generic helper add permissions
    throw new Error(`This utility is not familiar with the issuer: ${issuer}

Please add permissions by manually editing the configuration file \`${CONFIG_FILE} in \`${org}/${repo}\`.

The configuration file reference can be found here: https://docs.saml.to/configuration/reference
`);
  }
}
