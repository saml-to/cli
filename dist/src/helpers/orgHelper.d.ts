import { GithubSlsRestApiOrgRepoResponse } from '../../api/github-sls-rest-api';
import { Scms } from '../stores/scms';
export declare class OrgHelper {
    scms: Scms;
    constructor();
    fetchOrgs(): Promise<GithubSlsRestApiOrgRepoResponse[]>;
    promptOrg(operation: 'manage' | 'log in' | 'assume'): Promise<GithubSlsRestApiOrgRepoResponse>;
}
//# sourceMappingURL=orgHelper.d.ts.map