import { Show } from './show';
import { AwsHelper } from '../helpers/awsHelper';
import { ConfigHelper } from '../helpers/configHelper';
import { OrgHelper } from '../helpers/orgHelper';
export declare type AddSubcommands = 'provider' | 'permission';
export declare class Add {
    show: Show;
    awsHelper: AwsHelper;
    configHelper: ConfigHelper;
    orgHelper: OrgHelper;
    constructor();
    handle(subcommand: AddSubcommands): Promise<void>;
    private addProvider;
    private addPermission;
    private addPermissionV20211212;
}
//# sourceMappingURL=add.d.ts.map