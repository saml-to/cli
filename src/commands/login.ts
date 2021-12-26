import {
  IDPApi,
  Configuration,
  GithubSlsRestApiLoginResponseContainer,
} from '../../api/github-sls-rest-api';
import { ERROR_LOGGING_IN, MULTIPLE_LOGINS, NO_GITHUB_CLIENT } from '../messages';
import { Scms } from '../stores/scms';
import axios from 'axios';
import log from 'loglevel';
import open from 'open';
import { Show } from './show';
import { AwsHelper } from '../helpers/aws/awsHelper';

export class Login {
  scms: Scms;

  show: Show;

  awsHelper: AwsHelper;

  constructor() {
    this.scms = new Scms();
    this.show = new Show();
    this.awsHelper = new AwsHelper();
  }

  async handle(provider: string, org?: string): Promise<void> {
    log.debug(`Logging into ${provider} (org: ${org})`);

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
      log.debug('Opening browser to:', samlResponse.browserUri);
      await open(samlResponse.browserUri);
    } else {
      throw new Error(`Browser URI is not set.`);
    }
  }
}
