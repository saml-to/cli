import { Scms } from '../stores/scms';
export declare type AccessTokenResponse = {
    error?: string;
    error_description?: string;
    access_token: string;
    token_type: string;
    scope: string;
};
export declare class GithubHelper {
    scms: Scms;
    constructor();
    promptLogin(scope?: string, org?: string): Promise<void>;
    private getAccessToken;
    assertScope(scope: string, org?: string): Promise<void>;
    private assertScopes;
}
//# sourceMappingURL=githubHelper.d.ts.map