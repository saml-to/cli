/// <reference types="node" />
export declare class GenericHelper {
    promptUsers(provider: string, role?: string, users?: string[]): Promise<string[]>;
    outputEnv(vars: {
        [key: string]: string;
    }, platform?: NodeJS.Platform | 'github'): void;
}
//# sourceMappingURL=genericHelper.d.ts.map