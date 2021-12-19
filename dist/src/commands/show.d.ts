import { GithubSlsRestApiRoleResponse } from '../../api/github-sls-rest-api';
import { Scms } from '../stores/scms';
import { ConfigHelper } from '../helpers/configHelper';
import { OrgHelper } from '../helpers/orgHelper';
export declare type ShowSubcommands = 'metadata' | 'certificate' | 'roles' | 'logins' | 'orgs' | 'config';
export declare class Show {
    scms: Scms;
    configHelper: ConfigHelper;
    orgHelper: OrgHelper;
    constructor();
    handle(subcommand: ShowSubcommands, org?: string, save?: boolean, refresh?: boolean, raw?: boolean): Promise<void>;
    private showConfig;
    fetchMetadataXml(org: string): Promise<string>;
    private showMetadata;
    private showCertificate;
    private showOrgs;
    fetchRoles(org?: string, refresh?: boolean): Promise<GithubSlsRestApiRoleResponse[]>;
    private showRoles;
}
//# sourceMappingURL=show.d.ts.map