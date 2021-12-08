#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const loglevel_1 = __importDefault(require("loglevel"));
const command_1 = require("../src/command");
(async () => {
    try {
        loglevel_1.default.debug('Starting CLI');
        const command = new command_1.Command('saml-to');
        await command.run(process.argv);
    }
    catch (e) {
        if (e instanceof Error) {
            // eslint-disable-next-line no-console
            console.error(`Error: ${e.message}`, e);
            process.exit(-1);
        }
        throw e;
    }
    process.exit(0);
})();
//# sourceMappingURL=index.js.map