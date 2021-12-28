import { Scms } from '../stores/scms';
import { Show } from './show';
import { AwsHelper } from '../helpers/aws/awsHelper';
export declare class Login {
    scms: Scms;
    show: Show;
    awsHelper: AwsHelper;
    constructor();
    handle(provider: string, org?: string): Promise<void>;
    private assumeBrowser;
}
//# sourceMappingURL=login.d.ts.map