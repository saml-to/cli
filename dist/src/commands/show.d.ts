import { Scms } from '../stores/scms';
export declare type ShowSubcommands = 'config' | 'metadata' | 'certificate';
export declare class Show {
    scms: Scms;
    constructor();
    handle(subcommand: ShowSubcommands, org: string): Promise<void>;
    fetchConfig(org: string): Promise<string>;
    private showConfig;
    fetchMetadataXml(org: string): Promise<string>;
    private showMetadata;
    private showCertificate;
}
//# sourceMappingURL=show.d.ts.map