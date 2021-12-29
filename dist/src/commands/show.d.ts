import { GithubSlsRestApiRoleResponse, GithubSlsRestApiLoginResponse } from '../../api/github-sls-rest-api';
import { Scms } from '../stores/scms';
import { ConfigHelper } from '../helpers/configHelper';
import { OrgHelper } from '../helpers/orgHelper';
export declare type ShowSubcommands = 'metadata' | 'certificate' | 'entityId' | 'loginUrl' | 'logoutUrl' | 'roles' | 'logins' | 'orgs' | 'config';
export declare class Show {
    scms: Scms;
    configHelper: ConfigHelper;
    orgHelper: OrgHelper;
    constructor();
    handle(subcommand: ShowSubcommands, org?: string, provider?: string, save?: boolean, refresh?: boolean, raw?: boolean): Promise<void>;
    private showConfig;
    fetchEntityId(org: string): Promise<string>;
    fetchLoginUrl(org: string): Promise<string>;
    fetchLogoutUrl(org: string): Promise<string>;
    fetchMetadataXml(org: string): Promise<string>;
    private showMetadata;
    private showCertificate;
    private showOrgs;
    fetchRoles(org?: string, provider?: string, refresh?: boolean): Promise<GithubSlsRestApiRoleResponse[]>;
    private showRoles;
    fetchLogins(org?: string, refresh?: boolean): Promise<GithubSlsRestApiLoginResponse[]>;
    private showLogins;
    private showEntityId;
    private showLoginUrl;
    private showLogoutUrl;
}
//# sourceMappingURL=show.d.ts.map