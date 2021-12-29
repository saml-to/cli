import { ConfigHelper } from '../helpers/configHelper';
import { OrgHelper } from '../helpers/orgHelper';
import { Scms } from '../stores/scms';
export declare type SetSubcommands = 'provisioning';
export declare type ProvisioningTypes = 'scim';
export declare type SetHandleOpts = {
    type?: ProvisioningTypes;
    endpoint?: string;
    token?: string;
};
export declare class Set {
    orgHelper: OrgHelper;
    configHelper: ConfigHelper;
    scms: Scms;
    constructor();
    handle: (subcommand: SetSubcommands, provider: string, opts: SetHandleOpts) => Promise<void>;
    private promptProvisioning;
    private promptScimProvisioning;
    private promptScimProvisioningV20220101;
}
//# sourceMappingURL=set.d.ts.map