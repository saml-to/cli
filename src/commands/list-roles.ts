import { Scms } from '../stores/scms';
import { IDPApi, Configuration } from '../../api/github-sls-rest-api';
import { NOT_LOGGED_IN } from '../messages';

export class ListRoles {
  scms: Scms;

  constructor() {
    this.scms = new Scms();
  }

  async handle(): Promise<void> {
    const accessToken = this.scms.getGithubToken();
    if (!accessToken) {
      throw new Error(NOT_LOGGED_IN);
    }

    const idpApi = new IDPApi(
      new Configuration({
        accessToken: accessToken,
      }),
    );
    const { data: roles } = await idpApi.listRoles();
    console.table(roles.results, ['org', 'provider', 'role']);
  }
}
