import { GithubSlsRestApiNameIdFormatV1 } from '../../api/github-sls-rest-api';
import { Show } from './show';
import { AwsHelper } from '../helpers/aws/awsHelper';
import { ConfigHelper } from '../helpers/configHelper';
import { OrgHelper } from '../helpers/orgHelper';
import { GenericHelper } from '../helpers/genericHelper';
import { AwsSsoHelper } from '../helpers/aws/awsSsoHelper';
export declare type AddSubcommands = 'provider' | 'permission';
export declare type AddNameIdFormats = GithubSlsRestApiNameIdFormatV1 | 'none';
export declare type AddAttributes = {
    [key: string]: string;
};
export declare class Add {
    show: Show;
    awsHelper: AwsHelper;
    awsSsoHelper: AwsSsoHelper;
    configHelper: ConfigHelper;
    orgHelper: OrgHelper;
    genericHelper: GenericHelper;
    constructor();
    handle(subcommand: AddSubcommands, name?: string, entityId?: string, acsUrl?: string, loginUrl?: string, nameId?: string, nameIdFormat?: AddNameIdFormats, attributes?: {
        [key: string]: string;
    }): Promise<void>;
    private addProvider;
    private addPermission;
    private addPermissionV20220101;
}
//# sourceMappingURL=add.d.ts.map