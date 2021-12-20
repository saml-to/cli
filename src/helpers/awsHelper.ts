import {
  GithubSlsRestApiConfigV20211212,
  GithubSlsRestApiVariableV1,
  GithubSlsRestApiProviderV1,
  GithubSlsRestApiSamlResponseContainer,
  GithubSlsRestApiAwsAssumeSdkOptions,
} from '../../api/github-sls-rest-api';
import inquirer from 'inquirer';
import { ui } from '../command';
import { ConfigHelper } from './configHelper';
import { GenericHelper } from './genericHelper';
import { STS } from '@aws-sdk/client-sts';

export class AwsHelper {
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
    if (config.providers && config.providers.aws) {
      throw new Error(
        'An `aws` provider already exists, please manually edit the configuration to add another',
      );
    }

    if (config.variables && config.variables.awsAccountId) {
      throw new Error(
        'An `awsAccountId` variable already exists, please manually edit the configuration to add this provider',
      );
    }

    ui.updateBottomBar('');
    const { accountId } = await inquirer.prompt({
      type: 'input',
      name: 'accountId',
      message: `What is your AWS Account ID?`,
    });

    const newVariables: { [key: string]: GithubSlsRestApiVariableV1 } = {
      awsAccountId: `${accountId}`,
    };

    const newProvider: { [key: string]: GithubSlsRestApiProviderV1 } = {
      aws: {
        audience: 'https://signin.aws.amazon.com/saml',
        acs: 'https://signin.aws.amazon.com/saml',
        issuer: 'https://signin.aws.amazon.com/saml',
        nameId: '<#= user.github.login #>',
        attributes: {
          'https://aws.amazon.com/SAML/Attributes/RoleSessionName': '<#= user.github.login #>',
          'https://aws.amazon.com/SAML/Attributes/SessionDuration': '3600',
          'https://aws.amazon.com/SAML/Attributes/Role':
            '<#= user.selectedRole #>,arn:aws:iam::<$= awsAccountId $>:saml-provider/saml.to',
        },
      },
    };

    config.variables = { ...(config.variables || {}), ...newVariables };
    config.providers = { ...(config.providers || {}), ...newProvider };

    const { addPermissions } = await inquirer.prompt({
      type: 'confirm',
      name: 'addPermissions',
      message: `Would you like to grant any permissions to GitHub users now?`,
    });

    if (!addPermissions) {
      return this.configHelper.promptConfigUpdate(org, repo, config, `aws: add provider`);
    }

    return this.promptPermissionV20211212(org, repo, config);
  }

  public async promptPermissionV20211212(
    org: string,
    repo: string,
    config: GithubSlsRestApiConfigV20211212,
  ): Promise<boolean> {
    config.permissions = config.permissions || {};
    config.permissions.aws = config.permissions.aws || {};
    config.permissions.aws.roles = config.permissions.aws.roles || [];

    ui.updateBottomBar('');
    let roleArn: string;
    roleArn = (
      await inquirer.prompt({
        type: 'list',
        name: 'roleArn',
        message: `What is role you would like to allow for assumption?`,
        choices: [
          ...config.permissions.aws.roles.map((r) => ({ name: r.name })),
          { name: 'Add another role', value: '' },
        ],
      })
    ).roleArn;

    if (!roleArn) {
      const { arnInput } = await inquirer.prompt({
        type: 'input',
        name: 'arnInput',
        message: `What is ARN of the new role you would like to allow for assumption?
`,
        validate: (input) => {
          if (!input) {
            console.error('Invalid ARN!');
            return false;
          }
          // TODO ARN Validator
          return true;
        },
      });
      roleArn = arnInput;
    }

    const githubLogins = await this.genericHelper.promptUsers('aws', roleArn);

    const roleIx = config.permissions.aws.roles.findIndex(
      (r) => r.name && r.name.toLowerCase() === roleArn.toLowerCase(),
    );
    if (roleIx === -1) {
      config.permissions.aws.roles.push({ name: roleArn, users: { github: githubLogins } });
    } else {
      if (!config.permissions.aws.roles[roleIx].users) {
        config.permissions.aws.roles[roleIx].users = { github: githubLogins };
      } else {
        // Merge
        config.permissions.aws.roles[roleIx].users = {
          ...config.permissions.aws.roles[roleIx].users,
          github: [
            ...((config.permissions.aws.roles[roleIx].users || {}).github || []),
            ...githubLogins,
          ],
        };
      }
    }

    return this.configHelper.promptConfigUpdate(
      org,
      repo,
      config,
      `aws: grant permissions to role ${roleArn}

${githubLogins.map((l) => `- ${l}`)}`,
    );
  }

  async assumeAws(samlResponse: GithubSlsRestApiSamlResponseContainer): Promise<void> {
    const sts = new STS({});
    const opts = samlResponse.sdkOptions as GithubSlsRestApiAwsAssumeSdkOptions;
    if (!opts) {
      throw new Error('Missing sdk options from saml response');
    }
    const response = await sts.assumeRoleWithSAML({
      ...opts,
      SAMLAssertion: samlResponse.samlResponse,
    });
    if (
      !response.Credentials ||
      !response.Credentials.AccessKeyId ||
      !response.Credentials.SecretAccessKey ||
      !response.Credentials.SessionToken
    ) {
      throw new Error('Missing credentials');
    }
    this.genericHelper.outputEnv({
      AWS_ACCESS_KEY_ID: response.Credentials.AccessKeyId,
      AWS_SECRET_ACCESS_KEY: response.Credentials.SecretAccessKey,
      AWS_SESSION_TOKEN: response.Credentials.SessionToken,
    });
  }
}
