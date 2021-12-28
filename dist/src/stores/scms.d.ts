import { Octokit } from '@octokit/rest';
export declare const CONFIG_DIR: string;
export declare type Scm = 'github';
export declare type ScmClients = {
    github?: Octokit;
};
export declare class NoTokenError extends Error {
    constructor();
}
export declare class Scms {
    githubFile: string;
    orgFile: string;
    constructor(configDir?: string);
    loadClients(): Promise<ScmClients>;
    saveGithubOrg(org: string): string;
    saveGithubToken(token: string): string;
    getGithubToken(): string | undefined;
    getOrg(): string | undefined;
    private getOctokit;
    getLogin(): Promise<string>;
}
//# sourceMappingURL=scms.d.ts.map