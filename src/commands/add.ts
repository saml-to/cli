import {
  GithubSlsRestApiConfigV20220101,
  GithubSlsRestApiProviderV1,
  GithubSlsRestApiNameIdFormatV1,
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

export type AddNameIdFormats = GithubSlsRestApiNameIdFormatV1 | 'none';

export type AddAttributes = { [key: string]: string };

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

  public async handle(
    subcommand: AddSubcommands,
    name?: string,
    entityId?: string,
    acsUrl?: string,
    loginUrl?: string,
    nameId?: string,
    nameIdFormat?: AddNameIdFormats,
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
          attributes,
        );
        if (added) {
          console.log(`
Provider has been added!

Users can login or assume roles using the following commands:

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

  private async addProvider(
    name?: string,
    entityId?: string,
    acsUrl?: string,
    loginUrl?: string,
    nameId?: string,
    nameIdFormat?: AddNameIdFormats,
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
    const { org, repo } = await this.orgHelper.promptOrg('log in');

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
    const issuer: GithubSlsRestApiProviderV1 | undefined = (
      await inquirer.prompt({
        type: 'list',
        name: 'issuer',
        message: `For which provider would you like to grant user permission?`,
        choices: Object.entries(config.providers).map(([k, c]) => {
          return { name: k, value: c.entityId };
        }),
      })
    ).issuer;

    if (issuer && (issuer as string).toLowerCase().endsWith('.amazon.com/saml')) {
      return this.awsHelper.promptPermissionV20220101(org, repo, config);
    }

    // TODO: Generic helper add permissions
    throw new Error(`This utility is not familiar with the issuer: ${issuer}

Please add permissions by manually editing the configuration file \`${CONFIG_FILE} in \`${org}/${repo}\`.

The configuration file reference can be found here: https://docs.saml.to/configuration/reference
`);
  }
}
