import { GithubLogin } from './github-login';
import { Scms } from '../stores/scms';
import { Show } from './show';
export declare const CONFIG_FILE = "saml-to.yml";
export declare class GithubInit {
    githubLogin: GithubLogin;
    scms: Scms;
    show: Show;
    constructor();
    handle(force?: boolean): Promise<boolean>;
    private assertOrg;
    private assertRepo;
    private registerRepo;
}
//# sourceMappingURL=github-init.d.ts.map