/// <reference types="node" />
import { GithubSlsRestApiConfigV20220101, GithubSlsRestApiVariableV1 } from '../../api/github-sls-rest-api';
import { ConfigHelper } from './configHelper';
import { Scms } from '../stores/scms';
import { AddNameIdFormats } from '../commands/add';
export declare const trainCase: (str: string) => string;
export declare class GenericHelper {
    configHelper: ConfigHelper;
    scms: Scms;
    constructor();
    promptUsers(provider: string, role?: string, users?: string[]): Promise<string[]>;
    promptProvider(org: string, repo: string, config: any, name?: string, entityId?: string, acsUrl?: string, loginUrl?: string, nameId?: string, nameIdFormat?: AddNameIdFormats, attributes?: {
        [key: string]: string;
    }): Promise<boolean>;
    private promptProviderV20220101;
    promptPermissionV20220101(org: string, repo: string, provider: string, config: GithubSlsRestApiConfigV20220101): Promise<boolean>;
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