import { GithubSlsRestApiConfigV20220101 } from '../../../api/github-sls-rest-api';
import { ConfigHelper } from '../configHelper';
import { GenericHelper } from '../genericHelper';
export declare class AwsSsoHelper {
    configHelper: ConfigHelper;
    genericHelper: GenericHelper;
    constructor();
    promptProvider(org: string, repo: string, config: any): Promise<boolean>;
    private promptProviderV20220101;
    promptPermissionV20220101(org: string, repo: string, config: GithubSlsRestApiConfigV20220101): Promise<boolean>;
}
//# sourceMappingURL=awsSsoHelper.d.ts.map