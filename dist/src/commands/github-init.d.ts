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
    createConfig(org: string, repo: string, file?: string): Promise<void>;
    private registerRepo;
}
//# sourceMappingURL=github-init.d.ts.map