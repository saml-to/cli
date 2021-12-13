import { GithubLogin } from './github-login';
import { Scms } from '../stores/scms';
import { Show } from './show';
export declare class GithubInit {
    githubLogin: GithubLogin;
    scms: Scms;
    show: Show;
    constructor();
    handle(repoUrl: string): Promise<boolean>;
    private assertRepo;
    private assertScopes;
    private assertConfig;
    private listExamples;
    private createConfig;
}
//# sourceMappingURL=github-init.d.ts.map