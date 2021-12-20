import {
  GithubSlsRestApiConfigV20211212,
  GithubSlsRestApiProviderV1,
} from '../../../api/github-sls-rest-api';
import inquirer from 'inquirer';
import { ui } from '../../command';
import { ConfigHelper } from '../configHelper';
import { GenericHelper } from '../genericHelper';

export class AwsSsoHelper {
  configHelper: ConfigHelper;

  genericHelper: GenericHelper;

  constructor() {
    this.configHelper = new ConfigHelper();
    this.genericHelper = new GenericHelper();
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any
  async promptProvider(org: string, repo: string, config: any): Promise<boolean> {
    switch (config.version) {
      case '20211212':
        return this.promptProviderV20211212(org, repo, config as GithubSlsRestApiConfigV20211212);
      default:
        throw new Error(`Unknown version ${config.version}`);
    }
  }

  private async promptProviderV20211212(
    org: string,
    repo: string,
    config: GithubSlsRestApiConfigV20211212,
  ): Promise<boolean> {
    if (config.providers && config.providers['aws-sso']) {
      throw new Error(
        'An `aws-sso` provider already exists, please manually edit the configuration to add another',
      );
    }

    ui.updateBottomBar('');
    const { audience } = await inquirer.prompt({
      type: 'input',
      name: 'audience',
      message: `What is the AWS SSO Sign-in URL?`,
    });

    const { acs } = await inquirer.prompt({
      type: 'input',
      name: 'acs',
      message: `What is the AWS SSO ACS URL?`,
    });

    const { issuer } = await inquirer.prompt({
      type: 'input',
      name: 'issuer',
      message: `What is the AWS SSO issuer URL?`,
    });

    const newProvider: { [key: string]: GithubSlsRestApiProviderV1 } = {
      ['aws-sso']: {
        audience,
        acs,
        issuer,
        nameId: '<#= user.github.email #>',
        attributes: {},
      },
    };

    config.providers = { ...(config.providers || {}), ...newProvider };

    const { addPermissions } = await inquirer.prompt({
      type: 'confirm',
      name: 'addPermissions',
      message: `Would you like to grant any permissions to GitHub users now?`,
    });

    if (!addPermissions) {
      return this.configHelper.promptConfigUpdate(org, repo, config, `aws-sso: add provider`);
    }

    return this.promptPermissionV20211212(org, repo, config);
  }

  public async promptPermissionV20211212(
    org: string,
    repo: string,
    config: GithubSlsRestApiConfigV20211212,
  ): Promise<boolean> {
    config.permissions = config.permissions || {};
    config.permissions['aws-sso'] = config.permissions['aws-sso'] || {};
    config.permissions['aws-sso'].users = config.permissions['aws-sso'].users || {};
    config.permissions['aws-sso'].users.github = config.permissions['aws-sso'].users.github || [];

    const githubLogins = await this.genericHelper.promptUsers('aws-sso');

    const logins = new Set([...config.permissions['aws-sso'].users.github, ...githubLogins]);

    config.permissions['aws-sso'].users.github = [...logins];

    return this.configHelper.promptConfigUpdate(
      org,
      repo,
      config,
      `aws-sso: grant permissions to login

${githubLogins.map((l) => `- ${l}`)}`,
    );
  }
}
