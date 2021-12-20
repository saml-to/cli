export declare const ui: import("inquirer/lib/ui/bottom-bar");
export declare class Command {
    private name;
    private assume;
    private init;
    private show;
    private add;
    constructor(name: string);
    run(argv: string[]): Promise<void>;
}
//# sourceMappingURL=command.d.ts.map