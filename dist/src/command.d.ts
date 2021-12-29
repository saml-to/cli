export declare const ui: import("inquirer/lib/ui/bottom-bar");
export declare class Command {
    private name;
    private assume;
    private login;
    private init;
    private show;
    private add;
    private set;
    constructor(name: string);
    run(argv: string[]): Promise<void>;
}
//# sourceMappingURL=command.d.ts.map