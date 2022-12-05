import {
  GithubSlsRestApiConfigV20220101,
  GithubSlsRestApiProviderV1,
  GithubSlsRestApiSamlResponseContainer,
  GithubSlsRestApiAwsAssumeSdkOptions,
} from '../../../api/github-sls-rest-api';
import { prompt, ui } from '../../command';
import { ConfigHelper } from '../configHelper';
import { GenericHelper } from '../genericHelper';
import { STS } from '@aws-sdk/client-sts';
import { MessagesHelper } from '../messagesHelper';
import { ApiHelper } from '../apiHelper';
import { exec } from '../execHelper';
import moment from 'moment';

export class AwsHelper {
  configHelper: ConfigHelper;

  genericHelper: GenericHelper;

  constructor(apiHelper: ApiHelper, messagesHelper: MessagesHelper) {
    this.configHelper = new ConfigHelper(apiHelper);
    this.genericHelper = new GenericHelper(apiHelper, messagesHelper);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any
  async promptProvider(org: string, repo: string, config: any): Promise<boolean> {
    switch (config.version) {
      case '20220101':
        return this.promptProviderV20220101(org, repo, config as GithubSlsRestApiConfigV20220101);
      default:
        throw new Error(`Unknown version ${config.version}`);
    }
  }

  private async promptProviderV20220101(
    org: string,
    repo: string,
    config: GithubSlsRestApiConfigV20220101,
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
    const { accountId } = await prompt('accountId', {
      type: 'input',
      name: 'accountId',
      message: `What is your AWS Account ID?`,
    });

    const newProvider: { [key: string]: GithubSlsRestApiProviderV1 } = {
      aws: {
        entityId: 'https://signin.aws.amazon.com/saml',
        acsUrl: 'https://signin.aws.amazon.com/saml',
        loginUrl: 'https://signin.aws.amazon.com/saml',
        attributes: {
          'https://aws.amazon.com/SAML/Attributes/RoleSessionName': '<#= user.github.login #>',
          'https://aws.amazon.com/SAML/Attributes/SessionDuration': '3600',
          'https://aws.amazon.com/SAML/Attributes/Role': `<#= user.selectedRole #>,arn:aws:iam::${accountId}:saml-provider/saml.to`,
        },
      },
    };

    config.providers = { ...(config.providers || {}), ...newProvider };

    const { addPermissions } = await prompt('addPermissions', {
      type: 'confirm',
      name: 'addPermissions',
      message: `Would you like to grant any permissions to GitHub users now?`,
    });

    if (!addPermissions) {
      return this.configHelper.promptConfigUpdate(org, repo, config, `aws: add provider`);
    }

    return this.promptPermissionV20220101(org, repo, config);
  }

  public async promptPermissionV20220101(
    org: string,
    repo: string,
    config: GithubSlsRestApiConfigV20220101,
  ): Promise<boolean> {
    config.permissions = config.permissions || {};
    config.permissions.aws = config.permissions.aws || {};
    config.permissions.aws.roles = config.permissions.aws.roles || [];

    ui.updateBottomBar('');
    let roleArn: string;
    roleArn = (
      await prompt('role', {
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
      const { arnInput } = await prompt('arn', {
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

  async assumeAws(
    samlResponse: GithubSlsRestApiSamlResponseContainer,
    save?: string,
    headless?: boolean,
  ): Promise<void> {
    const sts = new STS({ region: 'us-east-1' });
    const opts = samlResponse.sdkOptions as GithubSlsRestApiAwsAssumeSdkOptions;
    if (!opts) {
      throw new Error('Missing sdk options from saml response');
    }

    if (save && !headless) {
      ui.updateBottomBar(`Updating AWS '${save}' Profile...`);
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

    const region = process.env.AWS_DEFAULT_REGION || 'us-east-1';

    if (save) {
      const base = ['aws', 'configure'];
      if (save !== 'default') {
        base.push('--profile', save);
      }
      base.push('set');
      await exec([...base, 'region', region]);
      await exec([...base, 'aws_access_key_id', response.Credentials.AccessKeyId]);
      await exec([...base, 'aws_secret_access_key', response.Credentials.SecretAccessKey]);
      await exec([...base, 'aws_session_token', response.Credentials.SessionToken]);

      if (headless) {
        try {
          this.genericHelper.outputEnv({
            AWS_PROFILE: save,
          });
          return;
        } catch (e) {}
      } else {
        ui.updateBottomBar('');
        console.log(
          `
⚠️ Credentials will expire ${moment(response.Credentials.Expiration).fromNow()}!`,
        );
        console.log(`
You can now run \`aws\` commands such as:

aws sts get-caller-identity --profile ${save}
aws ec2 describe-instances --profile ${save}
`);
      }

      return;
    }

    this.genericHelper.outputEnv({
      AWS_DEFAULT_REGION: region,
      AWS_ACCESS_KEY_ID: response.Credentials.AccessKeyId,
      AWS_SECRET_ACCESS_KEY: response.Credentials.SecretAccessKey,
      AWS_SESSION_TOKEN: response.Credentials.SessionToken,
    });
  }
}
