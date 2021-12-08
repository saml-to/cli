import { Octokit } from '@octokit/rest';
export declare type ScmClients = {
    github?: Octokit;
};
export declare class Scms {
    configDir: string;
    githubFile: string;
    constructor();
    loadClients(): Promise<ScmClients>;
    saveGithubToken(token: string): string;
    getGithubToken(): string | undefined;
    private getOctokit;
}
//# sourceMappingURL=scms.d.ts.map