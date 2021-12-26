import {
  IDPApi,
  Configuration,
  GithubSlsRestApiSamlResponseContainer,
} from '../../api/github-sls-rest-api';
import {
  ERROR_ASSUMING_ROLE,
  MULTIPLE_ROLES,
  NO_GITHUB_CLIENT,
  TERMINAL_NOT_SUPPORTED,
} from '../messages';
import { Scms } from '../stores/scms';
import axios from 'axios';
import log from 'loglevel';
import open from 'open';
import { Show } from './show';
import inquirer from 'inquirer';
import { ui } from '../command';
import { AwsHelper } from '../helpers/aws/awsHelper';

export class Assume {
  scms: Scms;

  show: Show;

  awsHelper: AwsHelper;

  constructor() {
    this.scms = new Scms();
    this.show = new Show();
    this.awsHelper = new AwsHelper();
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
    if (samlResponse.browserUri) {
      log.debug('Opening browser to:', samlResponse.browserUri);
      await open(samlResponse.browserUri);
    } else {
      throw new Error(`Browser URI is not set.`);
    }
  }

  private async assumeTerminal(samlResponse: GithubSlsRestApiSamlResponseContainer): Promise<void> {
    if (samlResponse.recipient.endsWith('.amazon.com/saml')) {
      return this.awsHelper.assumeAws(samlResponse);
    }

    throw new Error(TERMINAL_NOT_SUPPORTED(samlResponse.provider, samlResponse.recipient));
  }
}
