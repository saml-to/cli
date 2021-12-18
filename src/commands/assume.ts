import {
  IDPApi,
  Configuration,
  GithubSlsRestApiSamlResponseContainer,
  GithubSlsRestApiAwsAssumeSdkOptions,
} from '../../api/github-sls-rest-api';
import {
  ERROR_ASSUMING_ROLE,
  MULTIPLE_ROLES,
  NO_GITHUB_CLIENT,
  TERMINAL_NOT_SUPPORTED,
} from '../messages';
import { Scms } from '../stores/scms';
import axios from 'axios';
import { STS } from '@aws-sdk/client-sts';
import log from 'loglevel';
import open from 'open';
import { Show } from './show';
import inquirer from 'inquirer';
import { ui } from '../command';

export class Assume {
  scms: Scms;

  show: Show;

  constructor() {
    this.scms = new Scms();
    this.show = new Show();
  }

  async list(org?: string, refresh?: boolean): Promise<void> {
    const accessToken = this.scms.getGithubToken();
    if (!accessToken) {
      throw new Error(NO_GITHUB_CLIENT);
    }

    const idpApi = new IDPApi(
      new Configuration({
        accessToken: accessToken,
      }),
    );
    const { data: roles } = await idpApi.listRoles(org, refresh);
    console.table(roles.results, ['org', 'provider', 'role']);
  }

  async handle(role?: string, headless = false, org?: string, provider?: string): Promise<void> {
    log.debug(`Assuming ${role} (headless: ${headless} org: ${org} provider: ${provider})`);

    const token = this.scms.getGithubToken();
    if (!token) {
      throw new Error(NO_GITHUB_CLIENT);
    }

    if (!role && !headless) {
      const roles = await this.show.fetchRoles(org);
      if (!roles.length) {
        throw new Error(`No roles are available to assume`);
      }
      ui.updateBottomBar('');
      const { roleIx } = await inquirer.prompt({
        type: 'list',
        name: 'roleIx',
        message: `What role would you like to assume?`,
        choices: roles.map((r, ix) => {
          return { name: `${r.role} [${r.provider}@${r.org}]`, value: ix };
        }),
      });

      role = roles[roleIx].role;
      org = roles[roleIx].org;
      provider = roles[roleIx].provider;
    }

    if (!role) {
      throw new Error(`Please specify a role to assume`);
    }

    const idpApi = new IDPApi(
      new Configuration({
        accessToken: token,
      }),
    );

    try {
      const { data: response } = await idpApi.assumeRole(role, org, provider);
      if (headless) {
        await this.assumeTerminal(response);
      } else {
        await this.assumeBrowser(response);
      }
    } catch (e) {
      if (axios.isAxiosError(e) && e.response) {
        if (e.response.status === 403) {
          throw new Error(ERROR_ASSUMING_ROLE(role, `Reason: ${e.response.data.message}`));
        } else if (e.response.status === 404) {
          throw new Error(MULTIPLE_ROLES(role, `Reason: ${e.response.data.message}`));
        } else {
          throw e;
        }
      }
      throw e;
    }

    return;
  }

  private async assumeBrowser(samlResponse: GithubSlsRestApiSamlResponseContainer): Promise<void> {
    log.debug('Opening browser to:', samlResponse.browserUri);
    await open(samlResponse.browserUri);
  }

  private async assumeTerminal(samlResponse: GithubSlsRestApiSamlResponseContainer): Promise<void> {
    switch (samlResponse.recipient) {
      case 'https://signin.aws.amazon.com/saml':
        await this.assumeAws(samlResponse);
        break;
      default:
        throw new Error(TERMINAL_NOT_SUPPORTED(samlResponse.provider, samlResponse.recipient));
    }
  }

  private async assumeAws(samlResponse: GithubSlsRestApiSamlResponseContainer): Promise<void> {
    log.debug(`Assuming AWS role ${samlResponse.role}`);
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
    this.outputEnv({
      AWS_ACCESS_KEY_ID: response.Credentials.AccessKeyId,
      AWS_SECRET_ACCESS_KEY: response.Credentials.SecretAccessKey,
      AWS_SESSION_TOKEN: response.Credentials.SessionToken,
    });
  }

  private outputEnv(vars: { [key: string]: string }): void {
    const { platform } = process;
    let prefix = 'export';
    switch (platform) {
      case 'win32':
        prefix = 'setx';
        break;
      default:
        break;
    }

    Object.entries(vars).forEach(([key, value]) => {
      console.log(`${prefix} ${key}="${value}"`);
    });
  }
}
