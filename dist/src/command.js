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
const axios_1 = __importDefault(require("axios"));
const messages_1 = require("./messages");
const assume_1 = require("./commands/assume");
const github_init_1 = require("./commands/github-init");
const show_1 = require("./commands/show");
const inquirer_1 = __importDefault(require("inquirer"));
const scms_1 = require("./stores/scms");
const github_login_1 = require("./commands/github-login");
// import log from 'loglevel';
// log.setDefaultLevel('DEBUG');
process.on('SIGINT', () => {
    process.exit(0);
});
const loginWrapper = async (scope, fn) => {
    try {
        await fn();
    }
    catch (e) {
        if (e instanceof scms_1.NoTokenError) {
            const githubLogin = new github_login_1.GithubLogin();
            await githubLogin.handle(scope);
            await fn();
        }
        else {
            throw e;
        }
    }
};
exports.ui = new inquirer_1.default.ui.BottomBar();
class Command {
    name;
    assume;
    githubInit;
    show;
    constructor(name) {
        this.name = name;
        this.assume = new assume_1.Assume();
        this.githubInit = new github_init_1.GithubInit();
        this.show = new show_1.Show();
    }
    async run(argv) {
        const ya = yargs_1.default
            .scriptName(this.name)
            .command({
            command: 'init [scm]',
            describe: 'Set a repository for the saml.to configuration',
            handler: async ({ scm, repoUrl, force }) => {
                const handled = await this.githubInit.handle(scm, repoUrl, force);
                if (!handled) {
                    throw new Error(messages_1.UNSUPPORTED_REPO_URL);
                }
            },
            builder: {
                scm: {
                    demand: true,
                    choices: ['github'],
                    default: 'github',
                },
                repoUrl: {
                    demand: false,
                    type: 'string',
                },
                force: {
                    demand: false,
                    type: 'boolean',
                    default: false,
                },
            },
        })
            .command({
            command: 'show [subcommand]',
            describe: 'Show organization configs',
            handler: async ({ org, subcommand, save, refresh }) => loginWrapper('user:email', () => this.show.handle(subcommand, org, save, refresh)),
            builder: {
                subcommand: {
                    demand: true,
                    type: 'string',
                    choices: ['metadata', 'certificate', 'roles', 'logins', 'orgs'],
                },
                org: {
                    demand: false,
                    type: 'string',
                    description: 'Specify an organization',
                },
                save: {
                    demand: false,
                    type: 'boolean',
                    default: false,
                    description: 'Output to a file',
                },
                refresh: {
                    demand: false,
                    type: 'boolean',
                    default: false,
                    description: 'Refresh backend config',
                },
            },
        })
            .command({
            command: 'assume [role]',
            describe: 'Assume a role. Use the `show roles` command to show available roles',
            handler: ({ role, org, provider, headless }) => loginWrapper('user:email', () => this.assume.handle(role, headless, org, provider)),
            builder: {
                role: {
                    demand: false,
                    type: 'string',
                    description: 'The role to assume',
                },
                org: {
                    demand: false,
                    type: 'string',
                    description: 'Specify an organization',
                },
                headless: {
                    demand: false,
                    type: 'boolean',
                    default: false,
                    description: 'Output access credentials to the terminal',
                },
                provider: {
                    demand: false,
                    type: 'string',
                    description: 'Specify the provider',
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
                    exports.ui.updateBottomBar('');
                    console.error('Unauthorized');
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