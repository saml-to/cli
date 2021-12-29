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
const set_1 = require("./commands/set");
const inquirer_1 = __importDefault(require("inquirer"));
const scms_1 = require("./stores/scms");
const githubHelper_1 = require("./helpers/githubHelper");
const add_1 = require("./commands/add");
const login_1 = require("./commands/login");
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
    login;
    init;
    show;
    add;
    set;
    constructor(name) {
        this.name = name;
        this.assume = new assume_1.Assume();
        this.login = new login_1.Login();
        this.init = new init_1.Init();
        this.show = new show_1.Show();
        this.add = new add_1.Add();
        this.set = new set_1.Set();
    }
    async run(argv) {
        const ya = yargs_1.default
            .scriptName(this.name)
            .command({
            command: 'list-logins',
            describe: `Show providers that are available to login`,
            handler: async ({ org, provider, refresh }) => loginWrapper('user:email', () => this.show.handle('logins', org, provider, false, refresh, false)),
            builder: {
                org: {
                    demand: false,
                    type: 'string',
                    description: 'Specify an organization',
                },
                provider: {
                    demand: false,
                    type: 'string',
                    description: 'Specify an provider',
                },
                refresh: {
                    demand: false,
                    type: 'boolean',
                    default: false,
                    description: 'Refresh cached logins from source control',
                },
            },
        })
            .command({
            command: 'list-roles',
            describe: `Show roles that are available to assume`,
            handler: async ({ org, provider, refresh }) => loginWrapper('user:email', () => this.show.handle('roles', org, provider, false, refresh, false)),
            builder: {
                org: {
                    demand: false,
                    type: 'string',
                    description: 'Specify an organization',
                },
                provider: {
                    demand: false,
                    type: 'string',
                    description: 'Specify a provider',
                },
                refresh: {
                    demand: false,
                    type: 'boolean',
                    default: false,
                    description: 'Refresh cached logins from source control',
                },
            },
        })
            .command({
            command: 'login [provider]',
            describe: `Login to a provider`,
            handler: ({ org, provider }) => loginWrapper('user:email', () => this.login.handle(provider, org)),
            builder: {
                provider: {
                    demand: false,
                    type: 'string',
                    description: 'The provider for which to login',
                },
                org: {
                    demand: false,
                    type: 'string',
                    description: 'Specify an organization',
                },
            },
        })
            .command({
            command: 'assume [role]',
            describe: 'Assume a role',
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
            .command({
            command: 'init',
            describe: '(Administrative) Initialize SAML.to with a GitHub Repository',
            handler: async ({ force }) => {
                await this.init.handle(force);
                exports.ui.updateBottomBar('');
                console.log(`
Next, you can to configure a Service Provider for SAML.to.

The service provider will need your SAML Metadata or Certificicate, available with the following commands:
 - \`${this.name} show metadata\`
 - \`${this.name} show certificate\`
 - \`${this.name} add provider\`
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
            command: 'add provider [name]',
            describe: '(Administrative) Add a provider to the configuration',
            handler: async ({ name, entityId, acsUrl, loginUrl, nameId, nameIdFormat, attribute }) => {
                await loginWrapper('repo', () => this.add.handle('provider', name, entityId, acsUrl, loginUrl, nameId, nameIdFormat || 'NONE', attribute));
            },
            builder: {
                name: {
                    demand: false,
                    type: 'string',
                },
                entityId: {
                    demand: false,
                    type: 'string',
                },
                acsUrl: {
                    demand: false,
                    type: 'string',
                },
                loginUrl: {
                    demand: false,
                    type: 'string',
                },
                nameId: {
                    demand: false,
                    type: 'string',
                },
                nameIdFormat: {
                    demand: false,
                    type: 'string',
                    choices: ['id', 'login', 'email', 'emailV2', 'none'],
                },
                attribute: {
                    demand: false,
                    type: 'array',
                    description: 'Additional addtributes in key=value pairs',
                    coerce: (values) => {
                        if (!values || !Array.isArray(values)) {
                            return;
                        }
                        return values.reduce((acc, value) => {
                            try {
                                const parsed = JSON.parse(('{"' +
                                    value
                                        .replace(/^\s+|\s+$/g, '')
                                        .replace(/=(?=\s|$)/g, '="" ')
                                        .replace(/\s+(?=([^"]*"[^"]*")*[^"]*$)/g, '", "')
                                        .replace(/=/g, '": "') +
                                    '"}').replace(/""/g, '"'));
                                return {
                                    ...acc,
                                    ...parsed,
                                };
                            }
                            catch (e) {
                                if (e instanceof Error) {
                                    throw new Error(`Error parsing ${value}: ${e.message}`);
                                }
                            }
                        }, {});
                    },
                },
            },
        })
            .command({
            command: 'set [name] [subcommand]',
            describe: '(Administrative) Set a provider setting (e.g. provisioning',
            handler: async ({ name, subcommand, type, endpoint, token }) => {
                await loginWrapper('repo', () => this.set.handle(subcommand, name, {
                    type: type,
                    endpoint: endpoint,
                    token: token,
                }));
            },
            builder: {
                name: {
                    demand: true,
                    type: 'string',
                },
                subcommand: {
                    demand: true,
                    type: 'string',
                    choices: ['provisioning'],
                },
                type: {
                    demand: true,
                    type: 'string',
                    choices: ['scim'],
                },
                endpoint: {
                    demand: true,
                    type: 'string',
                },
                token: {
                    demand: true,
                    type: 'string',
                },
            },
        })
            .command({
            command: 'show [subcommand]',
            describe: `(Administrative) Show various configurations (metadata, certificate, entityId, config, etc.)`,
            handler: async ({ org, provider, subcommand, save, refresh, raw }) => loginWrapper('user:email', () => this.show.handle(subcommand, org, provider, save, refresh, raw)),
            builder: {
                subcommand: {
                    demand: true,
                    type: 'string',
                    choices: [
                        'metadata',
                        'certificate',
                        'entityId',
                        'loginUrl',
                        'logoutUrl',
                        'config',
                        'roles',
                        'logins',
                        'orgs',
                    ],
                },
                org: {
                    demand: false,
                    type: 'string',
                    description: 'Specify an organization',
                },
                provider: {
                    demand: false,
                    type: 'string',
                    description: 'Specify a provider',
                },
                save: {
                    demand: false,
                    type: 'boolean',
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