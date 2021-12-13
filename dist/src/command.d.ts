export declare const ui: import("inquirer/lib/ui/bottom-bar");
export declare class Command {
    private name;
    private listRoles;
    private githubLogin;
    private assume;
    private githubInit;
    private show;
    constructor(name: string);
    run(argv: string[]): Promise<void>;
}
//# sourceMappingURL=command.d.ts.map