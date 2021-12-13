export declare const NOT_LOGGED_IN = "To use this command, first use the `saml-to login` command.";
export declare const ERROR_LOADING_FILE: (file: string, error: Error) => string;
export declare const ERROR_ASSUMING_ROLE: (role: string, message: string) => string;
export declare const MULTIPLE_ROLES: (role: string, message: string) => string;
export declare const TERMINAL_NOT_SUPPORTED: (provider: string, recipient: string) => string;
export declare const UNSUPPORTED_REPO_URL = "Only the following repo URLs are supported: https://github.com/{org}/{repo}";
export declare const GITHUB_ACCESS_NEEDED: (org: string) => string;
export declare const REPO_DOES_NOT_EXIST: (org: string, repo: string) => string;
//# sourceMappingURL=messages.d.ts.map