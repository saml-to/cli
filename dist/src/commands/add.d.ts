import { Show } from './show';
import { AwsHelper } from '../helpers/awsHelper';
export declare type AddSubcommands = 'provider' | 'permission';
export declare class Add {
    show: Show;
    awsHelper: AwsHelper;
    constructor();
    handle(subcommand: AddSubcommands): Promise<void>;
    private addProvider;
    private addPermission;
    private addPermissionV20211212;
    private promptOrg;
}
//# sourceMappingURL=add.d.ts.map