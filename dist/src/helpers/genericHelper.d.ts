/// <reference types="node" />
import { GithubSlsRestApiVariableV1 } from '../../api/github-sls-rest-api';
import { ConfigHelper } from './configHelper';
export declare const trainCase: (str: string) => string;
export declare class GenericHelper {
    configHelper: ConfigHelper;
    constructor();
    promptUsers(provider: string, role?: string, users?: string[]): Promise<string[]>;
    promptProvider(org: string, repo: string, config: any): Promise<boolean>;
    private promptProviderV20211212;
    outputEnv(vars: {
        [key: string]: string;
    }, platform?: NodeJS.Platform | 'github'): void;
    promptAttributes(variables: {
        [key: string]: GithubSlsRestApiVariableV1;
    }, attributes?: {
        [key: string]: string;
    }): Promise<{
        [key: string]: string;
    }>;
}
//# sourceMappingURL=genericHelper.d.ts.map