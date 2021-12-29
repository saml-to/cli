import {
  IDPApi,
  Configuration,
  GithubSlsRestApiLoginResponseContainer,
  GithubSlsRestApiLoginResponse,
} from '../../api/github-sls-rest-api';
import { ERROR_LOGGING_IN, MULTIPLE_LOGINS, NO_GITHUB_CLIENT } from '../messages';
import { Scms } from '../stores/scms';
import axios from 'axios';
import open from 'open';
import { Show } from './show';
import { AwsHelper } from '../helpers/aws/awsHelper';
import { ui } from '../command';
import inquirer from 'inquirer';

export class Login {
  scms: Scms;

  show: Show;

  awsHelper: AwsHelper;

  constructor() {
    this.scms = new Scms();
    this.show = new Show();
    this.awsHelper = new AwsHelper();
  }

  async handle(provider?: string, org?: string): Promise<void> {
    if (!provider) {
      const choice = await this.promptLogin(org);
      provider = choice.provider;
      org = choice.org;
    }

    ui.updateBottomBar(`Logging into ${provider} (org: ${org})`);

    const token = this.scms.getGithubToken();
    if (!token) {
      throw new Error(NO_GITHUB_CLIENT);
    }

    const idpApi = new IDPApi(
      new Configuration({
        accessToken: token,
      }),
    );

    try {
      const { data: response } = await idpApi.providerLogin(provider, org);
      await this.assumeBrowser(response);
    } catch (e) {
      if (axios.isAxiosError(e) && e.response) {
        if (e.response.status === 403) {
          throw new Error(ERROR_LOGGING_IN(provider, `Reason: ${e.response.data.message}`));
        } else if (e.response.status === 404) {
          throw new Error(MULTIPLE_LOGINS(provider, `Reason: ${e.response.data.message}`));
        } else {
          throw e;
        }
      }
      throw e;
    }

    return;
  }

  private async assumeBrowser(samlResponse: GithubSlsRestApiLoginResponseContainer): Promise<void> {
    if (samlResponse.browserUri) {
      await open(samlResponse.browserUri);
    } else {
      throw new Error(`Browser URI is not set.`);
    }
  }

  async promptLogin(org?: string): Promise<GithubSlsRestApiLoginResponse> {
    const logins = await this.show.fetchLogins(org);

    ui.updateBottomBar('');
    const { loginIx } = await inquirer.prompt({
      type: 'list',
      name: 'loginIx',
      message: `For which provider would you like to log in?`,
      choices: logins.map((l, ix) => {
        return { name: `${l.provider} (${l.org})`, value: ix };
      }),
    });

    return logins[loginIx];
  }
}