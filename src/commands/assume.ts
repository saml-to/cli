import {
  IDPApi,
  Configuration,
  GithubSlsRestApiSamlResponseContainer,
  GithubSlsRestApiRoleResponse,
} from '../../api/github-sls-rest-api';
import {
  ERROR_ASSUMING_ROLE,
  MULTIPLE_ROLES,
  NO_GITHUB_CLIENT,
  TERMINAL_NOT_SUPPORTED,
} from '../messages';
import { Scms } from '../stores/scms';
import axios from 'axios';
import open from 'open';
import { Show } from './show';
import { prompt, ui } from '../command';
import { AwsHelper } from '../helpers/aws/awsHelper';
import { MessagesHelper } from '../helpers/messagesHelper';
import { event } from '../helpers/events';

export class Assume {
  scms: Scms;

  show: Show;

  awsHelper: AwsHelper;

  constructor(private messagesHelper: MessagesHelper) {
    this.scms = new Scms();
    this.show = new Show();
    this.awsHelper = new AwsHelper(messagesHelper);
  }

  async handle(role?: string, headless = false, org?: string, provider?: string): Promise<void> {
    event(this.scms, 'assume', undefined, org);

    if (!role && !headless) {
      const choice = await this.promptRole(org, provider);
      role = choice.role;
      org = choice.org;
      provider = choice.provider;
    }

    if (!headless) {
      ui.updateBottomBar(`Assuming ${role}`);
    }

    const token = this.scms.getGithubToken();
    if (!token) {
      throw new Error(NO_GITHUB_CLIENT);
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
      ui.updateBottomBar('');
      console.log(`Opening browser to ${new URL(samlResponse.browserUri).origin}`);
      const wait = process.platform !== 'darwin';
      const proc = await open(samlResponse.browserUri, {
        allowNonzeroExitCode: false,
        wait,
      });
      if (wait && proc.exitCode !== 0) {
        throw new Error(`Unable to open the browser. Please manually open a browser to:

${samlResponse.browserUri}`);
      }
    } else {
      new Error(`Browser URI is not set.`);
    }
  }

  private async assumeTerminal(samlResponse: GithubSlsRestApiSamlResponseContainer): Promise<void> {
    if (samlResponse.recipient.endsWith('.amazon.com/saml')) {
      return this.awsHelper.assumeAws(samlResponse);
    }

    throw new Error(TERMINAL_NOT_SUPPORTED(samlResponse.provider, samlResponse.recipient));
  }

  async promptRole(org?: string, provider?: string): Promise<GithubSlsRestApiRoleResponse> {
    ui.updateBottomBar('Fetching roles...');
    const roles = await this.show.fetchRoles(org, provider);

    if (roles.length === 0) {
      this.messagesHelper.getSetup('roles available to assume');
      throw new Error('No roles are available to assume');
    }

    ui.updateBottomBar('');
    const { roleIx } = await prompt('role', {
      type: 'list',
      name: 'roleIx',
      message: `Which role would you like to assume?`,
      choices: roles.map((r, ix) => {
        return { name: `${r.role} [${r.provider}] (${r.org})`, value: ix };
      }),
    });

    return roles[roleIx];
  }
}
