import inquirer from 'inquirer';
import { ui } from '../command';
import {
  GithubSlsRestApiOrgRepoResponse,
  IDPApi,
  Configuration,
} from '../../api/github-sls-rest-api';
import { Scms } from '../stores/scms';

export class OrgHelper {
  scms: Scms;

  constructor() {
    this.scms = new Scms();
  }

  public async fetchOrgs(): Promise<GithubSlsRestApiOrgRepoResponse[]> {
    const accessToken = this.scms.getGithubToken();
    const idpApi = new IDPApi(
      new Configuration({
        accessToken: accessToken,
      }),
    );
    const { data: orgs } = await idpApi.listOrgRepos();
    return orgs.results;
  }

  async promptOrg(
    operation: 'view' | 'manage' | 'log in' | 'assume',
  ): Promise<GithubSlsRestApiOrgRepoResponse> {
    const orgs = await this.fetchOrgs();
    if (!orgs.length) {
      throw new Error(`Please run the \`init\` command first`);
    }

    if (orgs.length === 1) {
      return orgs[0];
    }

    ui.updateBottomBar('');
    const { orgIx } = await inquirer.prompt({
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
