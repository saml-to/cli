import { GithubLogin } from './github-login';
import { Scms } from '../stores/scms';
import { Show } from './show';
export declare class GithubInit {
    githubLogin: GithubLogin;
    scms: Scms;
    show: Show;
    constructor();
    handle(scm: string, repoUrl?: string, force?: boolean): Promise<boolean>;
    assertRepo(org: string, repo: string, scope: string): Promise<void>;
    private registerRepo;
}
//# sourceMappingURL=github-init.d.ts.map