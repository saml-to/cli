import { GithubSlsRestApiRoleResponse, GithubSlsRestApiOrgResponse } from '../../api/github-sls-rest-api';
import { Scms } from '../stores/scms';
export declare type ShowSubcommands = 'metadata' | 'certificate' | 'roles' | 'logins' | 'orgs';
export declare class Show {
    scms: Scms;
    constructor();
    handle(subcommand: ShowSubcommands, org?: string, save?: boolean, refresh?: boolean): Promise<void>;
    fetchConfig(org: string): Promise<string>;
    fetchMetadataXml(org: string): Promise<string>;
    private showMetadata;
    private showCertificate;
    fetchOrgs(): Promise<GithubSlsRestApiOrgResponse[]>;
    private showOrgs;
    fetchRoles(org?: string, refresh?: boolean): Promise<GithubSlsRestApiRoleResponse[]>;
    private showRoles;
}
//# sourceMappingURL=show.d.ts.map