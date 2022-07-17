import {
  GithubSlsRestApiSamlResponseContainer,
  GithubSlsRestApiRoleResponse,
  GithubSlsRestApiAssumeBrowserResponse,
} from '../../api/github-sls-rest-api';
import {
  ERROR_ASSUMING_ROLE,
  MULTIPLE_ROLES,
  NO_GITHUB_CLIENT,
  TERMINAL_NOT_SUPPORTED,
} from '../messages';
import { Scms } from '../stores/scms';
import axios from 'axios';
import { ShowCommand } from './show';
import { prompt, ui } from '../command';
import { AwsHelper } from '../helpers/aws/awsHelper';
import { MessagesHelper } from '../helpers/messagesHelper';
import { event } from '../helpers/events';
import { openBrowser } from '../helpers/browserHelper';
import { ApiHelper } from '../helpers/apiHelper';

export class AssumeCommand {
  scms: Scms;

  show: ShowCommand;

  awsHelper: AwsHelper;

  constructor(private apiHelper: ApiHelper, private messagesHelper: MessagesHelper) {
    this.scms = new Scms();
    this.show = new ShowCommand(apiHelper);
    this.awsHelper = new AwsHelper(apiHelper, messagesHelper);
  }

  async handle(
    role?: string,
    headless = false,
    org?: string,
    provider?: string,
    save?: string,
  ): Promise<void> {
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

    if (!role) {
      throw new Error(`Please specify a role to assume`);
    }

    if (save !== undefined && !save) {
      save = role;
    }

    try {
      if (headless || save) {
        const token = this.scms.getGithubToken();
        if (!token) {
          throw new Error(NO_GITHUB_CLIENT);
        }
        const idpApi = this.apiHelper.idpApi(token);
        const { data: response } = await idpApi.assumeRole(role, org, provider);
        return await this.assumeTerminal(response, save, headless);
      } else {
        this.scms.getGithubToken();
        const idpApi = this.apiHelper.idpApi();
        const { data: response } = await idpApi.assumeRoleForBrowser(role, org, provider);
        return await this.assumeBrowser(response);
      }
    } catch (e) {
      if (axios.isAxiosError(e) && e.response) {
        if (e.response.status === 403) {
          throw new Error(
            ERROR_ASSUMING_ROLE(
              role,
              `Reason: ${(e.response.data as { message: string }).message}`,
            ),
          );
        } else if (e.response.status === 404) {
          throw new Error(
            MULTIPLE_ROLES(role, `Reason: ${(e.response.data as { message: string }).message}`),
          );
        } else {
          throw e;
        }
      }
      throw e;
    }
  }

  private async assumeBrowser(response: GithubSlsRestApiAssumeBrowserResponse): Promise<void> {
    if (response.browserUri) {
      const url = new URL(response.browserUri);
      try {
        const token = this.scms.getGithubToken();
        if (token) {
          url.searchParams.set('token', token);
        }
      } catch (e) {
        // pass
      }
      await openBrowser(url.toString());
    } else {
      new Error(`Browser URI is not set.`);
    }
  }

  private async assumeTerminal(
    samlResponse: GithubSlsRestApiSamlResponseContainer,
    save?: string,
    headless?: boolean,
  ): Promise<void> {
    if (samlResponse.recipient.endsWith('.amazon.com/saml')) {
      return this.awsHelper.assumeAws(samlResponse, save, headless);
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
