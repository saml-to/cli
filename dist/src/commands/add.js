"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Add = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const command_1 = require("../command");
const show_1 = require("./show");
const js_yaml_1 = require("js-yaml");
const awsHelper_1 = require("../helpers/awsHelper");
const github_init_1 = require("./github-init");
const configHelper_1 = require("../helpers/configHelper");
const orgHelper_1 = require("../helpers/orgHelper");
const genericHelper_1 = require("../helpers/genericHelper");
class Add {
    show;
    awsHelper;
    configHelper;
    orgHelper;
    genericHelper;
    constructor() {
        this.show = new show_1.Show();
        this.awsHelper = new awsHelper_1.AwsHelper();
        this.configHelper = new configHelper_1.ConfigHelper();
        this.orgHelper = new orgHelper_1.OrgHelper();
        this.genericHelper = new genericHelper_1.GenericHelper();
    }
    async handle(subcommand) {
        switch (subcommand) {
            case 'provider': {
                const added = await this.addProvider();
                if (added) {
                    console.log(`
Next, you may add permissions by running:
\`add permission\`

Additional providers can be added by running \`add provider\` again.
          `);
                }
                break;
            }
            case 'permission': {
                const added = await this.addPermission();
                if (added) {
                    console.log(`
Finally, the users that were provided can login or assume roles:
- \`login\`
- \`assume\`

Or, you can direct them to visit: https://saml.to/sso

Additional permissions can be added by running \`add permission\` again.
          `);
                }
                break;
            }
            default:
                throw new Error(`Unknown subcommand: ${subcommand}`);
        }
    }
    async addProvider() {
        const { org, repo } = await this.orgHelper.promptOrg('manage');
        command_1.ui.updateBottomBar('Fetching config...');
        const configYaml = await this.configHelper.fetchConfigYaml(org, true);
        const config = (0, js_yaml_1.load)(configYaml);
        if (!config.version) {
            throw new Error(`Missing version in config`);
        }
        command_1.ui.updateBottomBar('');
        const { type } = await inquirer_1.default.prompt({
            type: 'list',
            name: 'type',
            message: `What service would you like to add access to?`,
            choices: [
                {
                    name: 'AWS (Federated)',
                    value: 'aws',
                },
                { name: 'Other', value: 'other' },
            ],
        });
        let added = false;
        switch (type) {
            case 'aws': {
                added = await this.awsHelper.promptProvider(org, repo, config);
                break;
            }
            case 'other': {
                added = await this.genericHelper.promptProvider(org, repo, config);
                break;
            }
            default:
                throw new Error(`Unknown type: ${type}`);
        }
        if (added) {
            await this.configHelper.fetchConfigYaml(org);
            command_1.ui.updateBottomBar('');
            console.log('Configuration is valid!');
        }
        return added;
    }
    async addPermission() {
        const { org, repo } = await this.orgHelper.promptOrg('log in');
        const configYaml = await this.configHelper.fetchConfigYaml(org, true);
        const config = (0, js_yaml_1.load)(configYaml);
        if (!config.version) {
            throw new Error(`Missing version in config`);
        }
        let added = false;
        switch (config.version) {
            case '20211212': {
                added = await this.addPermissionV20211212(org, repo, config);
                break;
            }
            default:
                throw new Error(`Invalid config version: ${config.version}`);
        }
        if (added) {
            await this.configHelper.fetchConfigYaml(org);
            command_1.ui.updateBottomBar('');
            console.log('Configuration is valid!');
        }
        return added;
    }
    async addPermissionV20211212(org, repo, config) {
        if (!config.providers || !Object.keys(config.providers).length) {
            throw new Error(`There are no \`providers\` in the in \`${org}/${repo}/${github_init_1.CONFIG_FILE}\`. Add a provider first using the \`add provider\` command`);
        }
        command_1.ui.updateBottomBar('');
        const issuer = (await inquirer_1.default.prompt({
            type: 'list',
            name: 'issuer',
            message: `For which provider would you like to grant user permission?`,
            choices: Object.entries(config.providers).map(([k, c]) => {
                return { name: k, value: c.issuer };
            }),
        })).issuer;
        if (issuer && issuer.toLowerCase().endsWith('.amazon.com/saml')) {
            return this.awsHelper.promptPermissionV20211212(org, repo, config);
        }
        // TODO: Generic helper add permissions
        throw new Error(`This utility is not familiar with the issuer: ${issuer}

Please add permissions by manually editing the configuration file \`${github_init_1.CONFIG_FILE} in \`${org}/${repo}\`.

The configuration file reference can be found here: https://docs.saml.to/configuration/reference
`);
    }
}
exports.Add = Add;
//# sourceMappingURL=add.js.map