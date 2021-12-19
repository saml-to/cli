import { Scms } from '../stores/scms';
import { Show } from './show';
import { AwsHelper } from '../helpers/awsHelper';
export declare class Assume {
    scms: Scms;
    show: Show;
    awsHelper: AwsHelper;
    constructor();
    list(org?: string, refresh?: boolean): Promise<void>;
    handle(role?: string, headless?: boolean, org?: string, provider?: string): Promise<void>;
    private assumeBrowser;
    private assumeTerminal;
}
//# sourceMappingURL=assume.d.ts.map