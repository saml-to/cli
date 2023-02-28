import { Configuration as AuthConfiguration, JwtGithubApi } from '../../api/auth-sls-rest-api';
import { Configuration as IDPConfiguration, IDPApi, TotpApi } from '../../api/github-sls-rest-api';
import packageJson from '../../package.json';

type Headers = { 'user-agent': string; 'x-2fa-code'?: string };

export class ApiHelper {
  private dev = false;

  constructor(private argv: string[]) {
    this.dev = this.argv.includes('--dev');

    if (this.dev) {
      console.log(`
*******************
IN DEVELOPMENT MODE
*******************`);
    }
  }

  idpApi(accessToken?: string, twoFactorCode?: string): IDPApi {
    const headers: Headers = { 'user-agent': `cli/${packageJson.version}` };
    if (twoFactorCode) {
      headers['x-2fa-code'] = twoFactorCode;
    }
    const configuration = new IDPConfiguration({
      accessToken,
      baseOptions: {
        headers,
      },
    });
    if (this.dev) {
      configuration.basePath = 'https://sso-nonlive.saml.to/github';
      const apiKeyIx = this.argv.findIndex((i) => i === '--apiKey');
      configuration.apiKey = apiKeyIx !== -1 ? this.argv[apiKeyIx + 1] : undefined;
    }
    return new IDPApi(configuration);
  }

  totpApi(accessToken?: string, twoFactorCode?: string): TotpApi {
    const headers: Headers = { 'user-agent': `cli/${packageJson.version}` };
    if (twoFactorCode) {
      headers['x-2fa-code'] = twoFactorCode;
    }
    const configuration = new IDPConfiguration({
      accessToken,
      baseOptions: {
        headers,
      },
    });
    if (this.dev) {
      configuration.basePath = 'https://sso-nonlive.saml.to/github';
      const apiKeyIx = this.argv.findIndex((i) => i === '--apiKey');
      configuration.apiKey = apiKeyIx !== -1 ? this.argv[apiKeyIx + 1] : undefined;
    }
    return new TotpApi(configuration);
  }

  jwtGithubApi(twoFactorCode?: string): JwtGithubApi {
    const headers: Headers = { 'user-agent': `cli/${packageJson.version}` };
    if (twoFactorCode) {
      headers['x-2fa-code'] = twoFactorCode;
    }
    const configuration = new AuthConfiguration({
      baseOptions: {
        headers,
      },
    });
    if (this.dev) {
      configuration.basePath = 'https://sso-nonlive.saml.to/auth';
      const apiKeyIx = this.argv.findIndex((i) => i === '--apiKey');
      configuration.apiKey = apiKeyIx !== -1 ? this.argv[apiKeyIx + 1] : undefined;
    }
    return new JwtGithubApi(configuration);
  }
}
