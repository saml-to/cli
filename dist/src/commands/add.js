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
class Add {
    show;
    awsHelper;
    constructor() {
        this.show = new show_1.Show();
        this.awsHelper = new awsHelper_1.AwsHelper();
    }
    async handle(subcommand) {
        switch (subcommand) {
            case 'provider': {
                return this.addProvider();
            }
            case 'permission': {
                return this.addPermission();
            }
            default:
                throw new Error(`Unknown subcommand: ${subcommand}`);
        }
    }
    async addProvider() {
        const { org, repo } = await this.promptOrg();
        command_1.ui.updateBottomBar('Fetching config...');
        const configYaml = await this.show.fetchConfigYaml(org, true);
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
        switch (type) {
            case 'aws': {
                return this.awsHelper.promptProvider(org, repo, config);
            }
            default:
                throw new Error(`Unknown type: ${type}`);
        }
    }
    async addPermission() {
        const { org, repo } = await this.promptOrg();
        command_1.ui.updateBottomBar('Fetching config...');
        const configYaml = await this.show.fetchConfigYaml(org, true);
        const config = (0, js_yaml_1.load)(configYaml);
        if (!config.version) {
            throw new Error(`Missing version in config`);
        }
        switch (config.version) {
            case '20211212':
                return this.addPermissionV20211212(org, repo, config);
            default:
                throw new Error(`Invalid config version: ${config.version}`);
        }
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
    async promptOrg() {
        const orgs = await this.show.fetchOrgs();
        if (!orgs.length) {
            throw new Error(`Please run the \`init\` command first`);
        }
        if (orgs.length === 1) {
            return orgs[0];
        }
        command_1.ui.updateBottomBar('');
        const { orgIx } = await inquirer_1.default.prompt({
            type: 'list',
            name: 'orgIx',
            message: `Which organization would you like to manage?`,
            choices: orgs.map((o, ix) => {
                return { name: `${o.org} (${o.repo})`, value: ix };
            }),
        });
        return orgs[orgIx];
    }
}
exports.Add = Add;
//# sourceMappingURL=add.js.map