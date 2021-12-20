"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Command = exports.ui = void 0;
const helpers_1 = require("yargs/helpers");
const yargs_1 = __importDefault(require("yargs"));
const axios_1 = __importDefault(require("axios"));
const assume_1 = require("./commands/assume");
const init_1 = require("./commands/init");
const show_1 = require("./commands/show");
const inquirer_1 = __importDefault(require("inquirer"));
const scms_1 = require("./stores/scms");
const githubHelper_1 = require("./helpers/githubHelper");
const add_1 = require("./commands/add");
const loginWrapper = async (scope, fn) => {
    try {
        await fn();
    }
    catch (e) {
        if (e instanceof scms_1.NoTokenError) {
            const githubLogin = new githubHelper_1.GithubHelper();
            await githubLogin.promptLogin(scope);
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
    init;
    show;
    add;
    constructor(name) {
        this.name = name;
        this.assume = new assume_1.Assume();
        this.init = new init_1.Init();
        this.show = new show_1.Show();
        this.add = new add_1.Add();
    }
    async run(argv) {
        const ya = yargs_1.default
            .scriptName(this.name)
            .command({
            command: 'init',
            describe: 'Initialize SAML.to with a GitHub Repository (use `init --help` for more detail)',
            handler: async ({ force }) => {
                await this.init.handle(force);
                exports.ui.updateBottomBar('');
                console.log(`
Next, you can to configure a Service Provider for SAML.to.

The service provider will need your SAML Metadata or Certificicate, available with the following commands:
 - \`${this.name} show metadata --save\`
 - \`${this.name} show certificate --save\`

More information on Provider configuration can be found here: https://docs.saml.to/configuration/service-providers

Once a service provider is configured, you can then run:
\`${this.name} add provider\`
`);
            },
            builder: {
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
            command: 'add [subcommand]',
            describe: 'Add providers or permissions to the configuration (use `add --help` for more detail)',
            handler: async ({ subcommand }) => {
                await loginWrapper('repo', () => this.add.handle(subcommand));
            },
            builder: {
                subcommand: {
                    demand: true,
                    type: 'string',
                    choices: ['provider', 'permission'],
                },
            },
        })
            .command({
            command: 'show [subcommand]',
            describe: 'Show various configurations (use `show --help` for more detail)',
            handler: async ({ org, subcommand, save, refresh, raw }) => loginWrapper('user:email', () => this.show.handle(subcommand, org, save, refresh, raw)),
            builder: {
                subcommand: {
                    demand: true,
                    type: 'string',
                    choices: ['metadata', 'certificate', 'config', 'roles', 'logins', 'orgs'],
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
                raw: {
                    demand: false,
                    type: 'boolean',
                    default: false,
                    description: 'For `config` subcommand, show raw configuration',
                },
            },
        })
            .command({
            command: 'assume [role]',
            describe: 'Assume a role. Use the `show roles` command to show available roles (use `assume --help` for more detail)',
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