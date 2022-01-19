import { prompt, ui } from '../command';
import { GithubSlsRestApiOrgRepoResponse } from '../../api/github-sls-rest-api';
import { Scms } from '../stores/scms';
import { event } from './events';
import { ApiHelper } from './apiHelper';

export class OrgHelper {
  scms: Scms;

  constructor(private apiHelper: ApiHelper) {
    this.scms = new Scms();
  }

  public async fetchOrgs(): Promise<GithubSlsRestApiOrgRepoResponse[]> {
    const accessToken = this.scms.getGithubToken();
    const idpApi = this.apiHelper.idpApi(accessToken);
    const { data: orgs } = await idpApi.listOrgRepos();
    return orgs.results;
  }

  async promptOrg(
    operation: 'view' | 'manage' | 'log in' | 'assume',
  ): Promise<GithubSlsRestApiOrgRepoResponse> {
    event(this.scms, 'fn:promptOrg', operation);

    const orgs = await this.fetchOrgs();
    if (!orgs.length) {
      throw new Error(`Please run the \`init\` command first`);
    }

    if (orgs.length === 1) {
      return orgs[0];
    }

    ui.updateBottomBar('');
    const { orgIx } = await prompt('org', {
      type: 'list',
      name: 'orgIx',
      message: `For which organization would you like to ${operation}?`,
      choices: orgs.map((o, ix) => {
        return { name: `${o.org} (${o.repo})`, value: ix };
      }),
    });

    const org = this.scms.getOrg();
    if (!org) {
      this.scms.saveGithubOrg(orgs[orgIx].org);
    }

    return orgs[orgIx];
  }
}
