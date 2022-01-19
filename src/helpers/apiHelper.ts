import { Configuration as AuthConfiguration, JwtGithubApi } from '../../api/auth-sls-rest-api';
import { Configuration as IDPConfiguration, IDPApi } from '../../api/github-sls-rest-api';

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

  idpApi(accessToken?: string): IDPApi {
    const configuration = new IDPConfiguration({ accessToken });
    if (this.dev) {
      configuration.basePath = 'https://sso-nonlive.saml.to/github';
      const apiKeyIx = this.argv.findIndex((i) => i === '--apiKey');
      configuration.apiKey = apiKeyIx !== -1 ? this.argv[apiKeyIx + 1] : undefined;
    }
    return new IDPApi(configuration);
  }

  jwtGithubApi(): JwtGithubApi {
    const configuration = new AuthConfiguration();
    if (this.dev) {
      configuration.basePath = 'https://sso-nonlive.saml.to/auth';
      const apiKeyIx = this.argv.findIndex((i) => i === '--apiKey');
      configuration.apiKey = apiKeyIx !== -1 ? this.argv[apiKeyIx + 1] : undefined;
    }
    return new JwtGithubApi(configuration);
  }
}
