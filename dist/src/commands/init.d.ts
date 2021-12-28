import { GithubHelper } from '../helpers/githubHelper';
import { Scms } from '../stores/scms';
import { Show } from './show';
export declare const CONFIG_FILE = "saml-to.yml";
export declare class Init {
    githubHelper: GithubHelper;
    scms: Scms;
    show: Show;
    constructor();
    handle(force?: boolean): Promise<void>;
    private assertOrg;
    private assertRepo;
    private registerRepo;
}
//# sourceMappingURL=init.d.ts.map