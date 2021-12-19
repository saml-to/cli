import { Scms } from '../stores/scms';
export declare class ConfigHelper {
    scms: Scms;
    constructor();
    fetchConfigYaml(org: string, raw?: boolean): Promise<string>;
    promptConfigUpdate(org: string, repo: string, config: any, title: string): Promise<boolean>;
    private commitConfig;
}
//# sourceMappingURL=configHelper.d.ts.map