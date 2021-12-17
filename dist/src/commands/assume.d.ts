import { Scms } from '../stores/scms';
export declare class Assume {
    scms: Scms;
    constructor();
    list(org?: string, refresh?: boolean): Promise<void>;
    handle(role: string, headless?: boolean, org?: string, provider?: string): Promise<void>;
    private assumeBrowser;
    private assumeTerminal;
    private assumeAws;
    private outputEnv;
}
//# sourceMappingURL=assume.d.ts.map