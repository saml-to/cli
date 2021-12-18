import { GithubSlsRestApiRoleResponse, GithubSlsRestApiOrgRepoResponse } from '../../api/github-sls-rest-api';
import { Scms } from '../stores/scms';
export declare type ShowSubcommands = 'metadata' | 'certificate' | 'roles' | 'logins' | 'orgs' | 'config';
export declare class Show {
    scms: Scms;
    constructor();
    handle(subcommand: ShowSubcommands, org?: string, save?: boolean, refresh?: boolean, raw?: boolean): Promise<void>;
    fetchConfigYaml(org: string, raw?: boolean): Promise<string>;
    private showConfig;
    fetchMetadataXml(org: string): Promise<string>;
    private showMetadata;
    private showCertificate;
    fetchOrgs(): Promise<GithubSlsRestApiOrgRepoResponse[]>;
    private showOrgs;
    fetchRoles(org?: string, refresh?: boolean): Promise<GithubSlsRestApiRoleResponse[]>;
    private showRoles;
}
//# sourceMappingURL=show.d.ts.map