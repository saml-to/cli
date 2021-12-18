import {
  GithubSlsRestApiOrgRepoResponse,
  GithubSlsRestApiConfigV20211212,
  GithubSlsRestApiProviderV1,
} from '../../api/github-sls-rest-api';
import inquirer from 'inquirer';
import { ui } from '../command';
import { Show } from './show';
import { load } from 'js-yaml';
import { AwsHelper } from '../helpers/awsHelper';
import { CONFIG_FILE } from './github-init';

export type AddSubcommands = 'provider' | 'permission';

export class Add {
  show: Show;

  awsHelper: AwsHelper;

  constructor() {
    this.show = new Show();
    this.awsHelper = new AwsHelper();
  }

  public async handle(subcommand: AddSubcommands): Promise<void> {
    switch (subcommand) {
      case 'provider': {
        return this.addProvider();
      }
      case 'permission': {
        return this.addPermission();
      }
      default:
        throw new Error(`Unknown subcommand: ${subcommand}`);
    }
  }

  private async addProvider(): Promise<void> {
    const { org, repo } = await this.promptOrg();

    ui.updateBottomBar('Fetching config...');

    const configYaml = await this.show.fetchConfigYaml(org, true);

    const config = load(configYaml) as { version: string };

    if (!config.version) {
      throw new Error(`Missing version in config`);
    }

    ui.updateBottomBar('');
    const { type } = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: `What service would you like to add access to?`,
      choices: [
        {
          name: 'AWS (Federated)',
          value: 'aws',
        },
        { name: 'Other', value: 'other' },
      ],
    });

    switch (type) {
      case 'aws': {
        return this.awsHelper.promptProvider(org, repo, config);
      }
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }

  private async addPermission(): Promise<void> {
    const { org, repo } = await this.promptOrg();

    ui.updateBottomBar('Fetching config...');

    const configYaml = await this.show.fetchConfigYaml(org, true);

    const config = load(configYaml) as { version: string };

    if (!config.version) {
      throw new Error(`Missing version in config`);
    }

    switch (config.version) {
      case '20211212':
        return this.addPermissionV20211212(org, repo, config as GithubSlsRestApiConfigV20211212);
      default:
        throw new Error(`Invalid config version: ${config.version}`);
    }
  }

  private async addPermissionV20211212(
    org: string,
    repo: string,
    config: GithubSlsRestApiConfigV20211212,
  ): Promise<void> {
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

  private async promptOrg(): Promise<GithubSlsRestApiOrgRepoResponse> {
    const orgs = await this.show.fetchOrgs();
    if (!orgs.length) {
      throw new Error(`Please run the \`init\` command first`);
    }

    if (orgs.length === 1) {
      return orgs[0];
    }

    ui.updateBottomBar('');
    const { orgIx } = await inquirer.prompt({
      type: 'list',
      name: 'orgIx',
      message: `Which organization would you like to manage?`,
      choices: orgs.map((o, ix) => {
        return { name: `${o.org} (${o.repo})`, value: ix };
      }),
    });

    return orgs[orgIx];
  }
}
