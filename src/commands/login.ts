import {
  GithubSlsRestApiLoginResponseContainer,
  GithubSlsRestApiLoginResponse,
} from '../../api/github-sls-rest-api';
import { ERROR_LOGGING_IN, MULTIPLE_LOGINS, NO_GITHUB_CLIENT } from '../messages';
import { NoTokenError, Scms } from '../stores/scms';
import axios from 'axios';
import { ShowCommand } from './show';
import { AwsHelper } from '../helpers/aws/awsHelper';
import { GithubHelper } from '../helpers/githubHelper';
import { prompt, ui } from '../command';
import { MessagesHelper } from '../helpers/messagesHelper';
import { event } from '../helpers/events';
import { openBrowser } from '../helpers/browserHelper';
import { ApiHelper } from '../helpers/apiHelper';

export class LoginCommand {
  scms: Scms;

  show: ShowCommand;

  awsHelper: AwsHelper;

  githubHelper: GithubHelper;

  constructor(private apiHelper: ApiHelper, private messagesHelper: MessagesHelper) {
    this.scms = new Scms();
    this.show = new ShowCommand(apiHelper);
    this.awsHelper = new AwsHelper(apiHelper, messagesHelper);
    this.githubHelper = new GithubHelper(apiHelper, messagesHelper);
  }

  async handle(provider?: string, org?: string, withToken?: string): Promise<void> {
    event(this.scms, 'login', undefined, org);

    if (!provider) {
      const choice = await this.promptLogin(org);
      provider = choice.provider;
      org = choice.org;
    }

    if (provider === 'github') {
      if (withToken) {
        this.scms.saveGithubToken(withToken);
        return;
      }
      await this.githubHelper.promptLogin('user:email', org);
      return;
    }

    let message = `Logging into ${provider}`;
    if (org) {
      message = `${message} (org: ${org})`;
    }

    ui.updateBottomBar(message);

    const token = this.scms.getGithubToken();
    if (!token) {
      throw new Error(NO_GITHUB_CLIENT);
    }

    const idpApi = this.apiHelper.idpApi(token);

    try {
      const { data: response } = await idpApi.providerLogin(provider, org);
      await this.loginBrowser(response);
    } catch (e) {
      if (axios.isAxiosError(e) && e.response) {
        if (e.response.status === 403) {
          throw new Error(
            ERROR_LOGGING_IN(
              provider,
              `Reason: ${(e.response.data as { message: string }).message}`,
            ),
          );
        } else if (e.response.status === 404) {
          throw new Error(
            MULTIPLE_LOGINS(
              provider,
              `Reason: ${(e.response.data as { message: string }).message}`,
            ),
          );
        } else {
          throw e;
        }
      }
      throw e;
    }

    return;
  }

  private async loginBrowser(samlResponse: GithubSlsRestApiLoginResponseContainer): Promise<void> {
    if (samlResponse.browserUri) {
      await openBrowser(samlResponse.browserUri);
    } else {
      new Error(`Browser URI is not set.`);
    }
  }

  async promptLogin(org?: string): Promise<GithubSlsRestApiLoginResponse> {
    ui.updateBottomBar('Fetching logins...');

    let logins: GithubSlsRestApiLoginResponse[] | undefined;
    try {
      logins = await this.show.fetchLogins(org);
    } catch (e) {
      if (axios.isAxiosError(e)) {
        if (e.response && e.response.status === 401) {
          ui.updateBottomBar('');
          const { newLogin } = await prompt('newLogin', {
            type: 'confirm',
            name: 'newLogin',
            message: `There's a problem fetching logins with the stored token. Would you like to (re-)log in to GitHub?`,
          });
          if (newLogin) {
            await this.githubHelper.promptLogin('user:email', org);
            throw new Error(`New identity has been stored. Please run your desired command again.`);
          }
        }
      }
      if (e instanceof NoTokenError) {
        await this.githubHelper.promptLogin('user:email', org);
        await this.promptLogin(org);
      }
      if (e instanceof Error) {
        throw new Error(`Error fetching logins: ${e.message}`);
      }
      throw e;
    }

    if (logins.length === 0) {
      this.messagesHelper.getSetup('logins configured');
      throw new Error('No logins are available');
    }

    ui.updateBottomBar('');
    const { loginIx } = await prompt('provider', {
      type: 'list',
      name: 'loginIx',
      message: `For which provider would you like to log in?`,
      choices: [
        ...logins.map((l, ix) => {
          return { name: `${l.provider} (${l.org})`, value: ix };
        }),
        { name: '[New GitHub Identity]', value: '**GH_IDENTITY**' },
      ],
    });

    if (loginIx === '**GH_IDENTITY**') {
      await this.githubHelper.promptLogin('user:email', org);
      return this.promptLogin(org);
    }

    return logins[loginIx];
  }
}
