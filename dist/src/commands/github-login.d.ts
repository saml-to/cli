import { Scms } from '../stores/scms';
export declare type AccessTokenResponse = {
    error?: string;
    error_description?: string;
    access_token: string;
    token_type: string;
    scope: string;
};
export declare class GithubLogin {
    scms: Scms;
    constructor();
    handle(): Promise<void>;
    private getAccessToken;
}
//# sourceMappingURL=github-login.d.ts.map