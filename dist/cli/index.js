#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../src");
const loglevel_1 = __importDefault(require("loglevel"));
(async () => {
    try {
        loglevel_1.default.debug('Starting CLI');
        // eslint-disable-next-line no-console
        console.log((0, src_1.comingSoon)());
    }
    catch (e) {
        if (e instanceof Error) {
            // eslint-disable-next-line no-console
            console.error(`Exror: ${e.message}`);
            process.exit(-1);
        }
        throw e;
    }
    process.exit(0);
})();
//# sourceMappingURL=index.js.map