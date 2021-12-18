import { Scms } from '../stores/scms';
export declare class ConfigHelper {
    scms: Scms;
    constructor();
    promptConfigUpdate(org: string, repo: string, config: any, title: string): Promise<void>;
    private commitConfig;
}
//# sourceMappingURL=configHelper.d.ts.map