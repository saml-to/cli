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
class Add {
    show;
    awsHelper;
    configHelper;
    orgHelper;
    constructor() {
        this.show = new show_1.Show();
        this.awsHelper = new awsHelper_1.AwsHelper();
        this.configHelper = new configHelper_1.ConfigHelper();
        this.orgHelper = new orgHelper_1.OrgHelper();
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
        switch (type) {
            case 'aws': {
                await this.awsHelper.promptProvider(org, repo, config);
                break;
            }
            default:
                throw new Error(`Unknown type: ${type}`);
        }
        await this.configHelper.fetchConfigYaml(org);
        command_1.ui.updateBottomBar('');
        console.log('Configuration is valid!');
    }
    async addPermission() {
        const { org, repo } = await this.orgHelper.promptOrg('log in');
        const configYaml = await this.configHelper.fetchConfigYaml(org, true);
        const config = (0, js_yaml_1.load)(configYaml);
        if (!config.version) {
            throw new Error(`Missing version in config`);
        }
        switch (config.version) {
            case '20211212': {
                await this.addPermissionV20211212(org, repo, config);
                break;
            }
            default:
                throw new Error(`Invalid config version: ${config.version}`);
        }
        await this.configHelper.fetchConfigYaml(org);
        command_1.ui.updateBottomBar('');
        console.log('Configuration is valid!');
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