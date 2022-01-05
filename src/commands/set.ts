import {
  GithubSlsRestApiConfigV20220101,
  IDPApi,
  Configuration,
} from '../../api/github-sls-rest-api';
import { load } from 'js-yaml';
import { ConfigHelper } from '../helpers/configHelper';
import { ui } from '../command';
import { OrgHelper } from '../helpers/orgHelper';
import { Scms } from '../stores/scms';
import { event } from '../helpers/events';
import inquirer from 'inquirer';

export type SetSubcommands = 'provisioning';

export type ProvisioningTypes = 'scim';

export type SetHandleOpts = {
  type?: ProvisioningTypes;
  endpoint?: string;
  token?: string;
};

export class Set {
  orgHelper: OrgHelper;

  configHelper: ConfigHelper;

  scms: Scms;

  constructor() {
    this.orgHelper = new OrgHelper();
    this.configHelper = new ConfigHelper();
    this.scms = new Scms();
  }

  handle = async (
    subcommand: SetSubcommands,
    provider: string,
    opts: SetHandleOpts,
  ): Promise<void> => {
    event(this.scms, 'set', subcommand);

    switch (subcommand) {
      case 'provisioning': {
        await this.promptProvisioning(provider, opts);
        break;
      }
      default:
        throw new Error(`Unknown subcommand: ${subcommand}`);
    }
  };

  private promptProvisioning = async (provider: string, opts: SetHandleOpts): Promise<boolean> => {
    let { type } = opts;
    if (!type) {
      type = (
        await inquirer.prompt({
          type: 'list',
          name: 'type',
          message: `What is the type of Provisioning?`,
          choices: [{ name: 'SCIM', value: 'scim' }],
        })
      ).type;
    }

    switch (type) {
      case 'scim': {
        return this.promptScimProvisioning(provider, opts);
      }
      default:
        throw new Error(`Unknown provisioning type: ${type}`);
    }
  };

  private promptScimProvisioning = async (
    provider: string,
    opts: SetHandleOpts,
  ): Promise<boolean> => {
    const { org, repo } = await this.orgHelper.promptOrg('log in');

    ui.updateBottomBar('Fetching config...');

    const configYaml = await this.configHelper.fetchConfigYaml(org, true);

    const config = load(configYaml) as { version: string };

    if (!config.version) {
      throw new Error(`Missing version in config`);
    }

    let added;
    switch (config.version) {
      case '20220101': {
        added = await this.promptScimProvisioningV20220101(
          org,
          repo,
          provider,
          config as GithubSlsRestApiConfigV20220101,
          opts.endpoint,
          opts.token,
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
  };

  private promptScimProvisioningV20220101 = async (
    org: string,
    repo: string,
    provider: string,
    config: GithubSlsRestApiConfigV20220101,
    endpoint?: string,
    token?: string,
  ): Promise<boolean> => {
    if (!endpoint) {
      endpoint = (
        await inquirer.prompt({
          type: 'input',
          name: 'endpoint',
          message: 'What is the SCIM endpoint?',
        })
      ).endpoint as string;
    }

    if (!token) {
      token = (
        await inquirer.prompt({
          type: 'password',
          name: 'token',
          message: 'What is the SCIM token (we will encrypt it for you!)?',
        })
      ).token as string;
    }

    const { providers } = config;
    if (!providers) {
      throw new Error(`Missing providers in config`);
    }

    const providerConfig = providers[provider];
    if (!providerConfig) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    const accessToken = this.scms.getGithubToken();

    const idpApi = new IDPApi(
      new Configuration({
        accessToken,
      }),
    );

    ui.updateBottomBar('Encrypting token...');

    const { data } = await idpApi.encrypt(org, { value: token });

    const { encryptedValue } = data;

    providerConfig.provisioning = { scim: { endpoint, encryptedToken: encryptedValue } };

    return this.configHelper.promptConfigUpdate(org, repo, config, `${provider}: set provisioning`);
  };
}
