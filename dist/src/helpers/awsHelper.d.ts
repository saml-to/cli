import {
  GithubSlsRestApiConfigV20220101,
  GithubSlsRestApiSamlResponseContainer,
} from '../../api/github-sls-rest-api';
import { ConfigHelper } from './configHelper';
import { GenericHelper } from './genericHelper';
export declare class AwsHelper {
  configHelper: ConfigHelper;
  genericHelper: GenericHelper;
  constructor();
  promptProvider(org: string, repo: string, config: any): Promise<boolean>;
  private promptProviderV20220101;
  promptPermissionV20220101(
    org: string,
    repo: string,
    config: GithubSlsRestApiConfigV20220101,
  ): Promise<boolean>;
  assumeAws(samlResponse: GithubSlsRestApiSamlResponseContainer): Promise<void>;
}
//# sourceMappingURL=awsHelper.d.ts.map
