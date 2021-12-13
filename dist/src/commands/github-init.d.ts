import { GithubLogin } from './github-login';
export declare class GithubInit {
    githubLogin: GithubLogin;
    constructor();
    handle(repoUrl: string): Promise<boolean>;
    private assertRepo;
    private assertScopes;
    private assertConfig;
}
//# sourceMappingURL=github-init.d.ts.map