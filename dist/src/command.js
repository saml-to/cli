"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Command = void 0;
/* eslint-disable no-console */
// import yargs from 'yargs';
const helpers_1 = require("yargs/helpers");
// import log from 'loglevel';
const yargs_1 = __importDefault(require("yargs"));
const list_roles_1 = require("./commands/list-roles");
const axios_1 = __importDefault(require("axios"));
const github_login_1 = require("./commands/github-login");
const messages_1 = require("./messages");
const assume_1 = require("./commands/assume");
class Command {
    name;
    listRoles;
    githubLogin;
    assume;
    constructor(name) {
        this.name = name;
        this.githubLogin = new github_login_1.GithubLogin();
        this.listRoles = new list_roles_1.ListRoles();
        this.assume = new assume_1.Assume();
    }
    async run(argv) {
        await yargs_1.default
            .scriptName(this.name)
            .command({
            command: 'login [scm]',
            describe: 'Generate and locally store a token from the SCM (e.g. GitHub)',
            handler: ({ scm }) => {
                if (scm === 'github') {
                    return this.githubLogin.handle();
                }
                else {
                    throw new Error(`Unknown scm provider: ${scm}`);
                }
            },
            builder: {
                scm: {
                    demand: true,
                    choices: ['github'],
                    default: 'github',
                },
            },
        })
            .command({
            command: 'list-roles',
            describe: 'List available roles for assumption',
            handler: () => this.listRoles.handle(),
        })
            .command({
            command: 'assume [role]',
            describe: 'Assume a role',
            handler: ({ role }) => this.assume.handle(role),
            builder: {
                role: {
                    demand: true,
                    type: 'string',
                },
            },
        })
            // .command({
            //   command: 'generate [moduleType] [moduleNames...]',
            //   describe: 'Generates a resource',
            //   handler: (parsed) => console.log('your handler goes here', parsed),
            //   builder: {
            //     moduleType: {
            //       demand: true,
            //       choices: ['routed', 'stateful'] as const,
            //       default: 'routed',
            //     },
            //     moduleNames: {
            //       demand: true,
            //       array: true,
            //     },
            //   },
            // })
            .help()
            .showHelpOnFail(true)
            .strict()
            .wrap(null)
            .fail((_, error) => {
            if (axios_1.default.isAxiosError(error)) {
                if (error.response && error.response.status === 401) {
                    console.error(messages_1.NOT_LOGGED_IN);
                }
                else {
                    console.error(`API Error: ${(error.response && error.response.data && error.response.data.message) ||
                        error.message}`);
                }
            }
            else {
                console.error(`Error: ${error.message}`);
            }
            process.exit(-1);
        })
            .parse((0, helpers_1.hideBin)(argv));
    }
}
exports.Command = Command;
//# sourceMappingURL=command.js.map