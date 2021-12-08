export declare class Command {
    private name;
    private listRoles;
    private githubLogin;
    private assume;
    constructor(name: string);
    run(argv: string[]): Promise<void>;
}
//# sourceMappingURL=command.d.ts.map