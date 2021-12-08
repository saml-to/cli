import { Scms } from '../stores/scms';
export declare class Assume {
    scms: Scms;
    constructor();
    handle(role: string, web?: boolean, org?: string, repo?: string, provider?: string): Promise<void>;
    private assumeTerminal;
    private assumeAws;
    private outputEnv;
}
//# sourceMappingURL=assume.d.ts.map