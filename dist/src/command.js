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
const github_init_1 = require("./commands/github-init");
const loglevel_1 = __importDefault(require("loglevel"));
loglevel_1.default.setDefaultLevel('DEBUG');
class Command {
    name;
    listRoles;
    githubLogin;
    assume;
    githubInit;
    constructor(name) {
        this.name = name;
        this.githubLogin = new github_login_1.GithubLogin();
        this.listRoles = new list_roles_1.ListRoles();
        this.assume = new assume_1.Assume();
        this.githubInit = new github_init_1.GithubInit();
    }
    async run(argv) {
        const ya = yargs_1.default
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
            command: 'init [repoUrl]',
            describe: 'Initialize a repository to use with saml.to',
            handler: async ({ repoUrl }) => {
                const handled = await this.githubInit.handle(repoUrl);
                if (handled) {
                    console.log('Successfully initialized', repoUrl);
                }
                else {
                    throw new Error(messages_1.UNSUPPORTED_REPO_URL);
                }
            },
            builder: {
                repoUrl: {
                    demand: true,
                    type: 'string',
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
            describe: 'Assume a role. Use the `list-roles` command to see available role',
            handler: ({ role, org, repo, provider, headless }) => this.assume.handle(role, headless, org, repo, provider),
            builder: {
                role: {
                    demand: true,
                    type: 'string',
                },
                headless: {
                    demand: false,
                    type: 'boolean',
                    default: false,
                    description: 'Output access credentials to the terminal',
                },
                org: {
                    demand: false,
                    type: 'string',
                    description: 'Specify the organization with SAML.to configuration',
                },
                provider: {
                    demand: false,
                    type: 'string',
                    description: 'Specify a specific provider',
                },
            },
        })
            .help()
            .showHelpOnFail(true)
            .strict()
            .wrap(null)
            .fail((msg, error) => {
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
                console.error(`Error: ${error ? error.message : msg}`);
            }
            process.exit(-1);
        });
        const parsed = await ya.parse((0, helpers_1.hideBin)(argv));
        if (parsed._.length === 0) {
            ya.showHelp();
        }
    }
}
exports.Command = Command;
//# sourceMappingURL=command.js.map