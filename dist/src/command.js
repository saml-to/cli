"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Command = exports.ui = void 0;
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
const show_1 = require("./commands/show");
const inquirer_1 = __importDefault(require("inquirer"));
// import log from 'loglevel';
// log.setDefaultLevel('DEBUG');
exports.ui = new inquirer_1.default.ui.BottomBar();
class Command {
    name;
    listRoles;
    githubLogin;
    assume;
    githubInit;
    show;
    constructor(name) {
        this.name = name;
        this.githubLogin = new github_login_1.GithubLogin();
        this.listRoles = new list_roles_1.ListRoles();
        this.assume = new assume_1.Assume();
        this.githubInit = new github_init_1.GithubInit();
        this.show = new show_1.Show();
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
                if (!handled) {
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
            command: 'show [org] [subcommand]',
            describe: 'Show organization configs',
            handler: async ({ org, subcommand }) => {
                await this.show.handle(subcommand, org);
            },
            builder: {
                org: {
                    demand: true,
                    type: 'string',
                },
                subcommand: {
                    demand: true,
                    type: 'string',
                    choices: ['config', 'metadata', 'certificate'],
                    default: 'config',
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
            .option('debug', { default: false })
            .help()
            .showHelpOnFail(true)
            .strict()
            .wrap(null)
            .fail((msg, error) => {
            if (axios_1.default.isAxiosError(error)) {
                if (error.response && error.response.status === 401) {
                    exports.ui.updateBottomBar('');
                    console.error(messages_1.NOT_LOGGED_IN);
                }
                else {
                    exports.ui.updateBottomBar('');
                    console.error(`API Error: ${(error.response && error.response.data && error.response.data.message) ||
                        error.message}`);
                }
            }
            else {
                exports.ui.updateBottomBar('');
                console.error(`Error: ${error ? error.message : msg}`);
            }
            process.exit(-1);
        });
        const parsed = await ya.parse((0, helpers_1.hideBin)(argv));
        if (parsed._.length === 0) {
            ya.showHelp();
        }
        process.exit(0);
    }
}
exports.Command = Command;
//# sourceMappingURL=command.js.map