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
const awsHelper_1 = require("../helpers/aws/awsHelper");
const init_1 = require("./init");
const configHelper_1 = require("../helpers/configHelper");
const orgHelper_1 = require("../helpers/orgHelper");
const genericHelper_1 = require("../helpers/genericHelper");
const awsSsoHelper_1 = require("../helpers/aws/awsSsoHelper");
class Add {
    show;
    awsHelper;
    awsSsoHelper;
    configHelper;
    orgHelper;
    genericHelper;
    constructor() {
        this.show = new show_1.Show();
        this.awsHelper = new awsHelper_1.AwsHelper();
        this.awsSsoHelper = new awsSsoHelper_1.AwsSsoHelper();
        this.configHelper = new configHelper_1.ConfigHelper();
        this.orgHelper = new orgHelper_1.OrgHelper();
        this.genericHelper = new genericHelper_1.GenericHelper();
    }
    async handle(subcommand, name, entityId, acsUrl, loginUrl, nameId, nameIdFormat, attributes) {
        switch (subcommand) {
            case 'provider': {
                const added = await this.addProvider(name, entityId, acsUrl, loginUrl, nameId, nameIdFormat, attributes);
                if (added) {
                    console.log(`
Provider has been added!

Users can login or assume roles using the following commands:

 - \`saml-to login\`
 - \`saml-to assume\``);
                }
                break;
            }
            case 'permission': {
                const added = await this.addPermission();
                if (added) {
                    console.log(`
Permissions have been granted!`);
                }
                break;
            }
            default:
                throw new Error(`Unknown subcommand: ${subcommand}`);
        }
    }
    async addProvider(name, entityId, acsUrl, loginUrl, nameId, nameIdFormat, attributes) {
        const { org, repo } = await this.orgHelper.promptOrg('manage');
        command_1.ui.updateBottomBar('Fetching config...');
        const configYaml = await this.configHelper.fetchConfigYaml(org, true);
        const config = (0, js_yaml_1.load)(configYaml);
        if (!config.version) {
            throw new Error(`Missing version in config`);
        }
        const added = await this.genericHelper.promptProvider(org, repo, config, name, entityId, acsUrl, loginUrl, nameId, nameIdFormat, attributes);
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
            case '20220101': {
                added = await this.addPermissionV20220101(org, repo, config);
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
    async addPermissionV20220101(org, repo, config) {
        if (!config.providers || !Object.keys(config.providers).length) {
            throw new Error(`There are no \`providers\` in the in \`${org}/${repo}/${init_1.CONFIG_FILE}\`. Add a provider first using the \`add provider\` command`);
        }
        command_1.ui.updateBottomBar('');
        const issuer = (await inquirer_1.default.prompt({
            type: 'list',
            name: 'issuer',
            message: `For which provider would you like to grant user permission?`,
            choices: Object.entries(config.providers).map(([k, c]) => {
                return { name: k, value: c.entityId };
            }),
        })).issuer;
        if (issuer && issuer.toLowerCase().endsWith('.amazon.com/saml')) {
            return this.awsHelper.promptPermissionV20220101(org, repo, config);
        }
        // TODO: Generic helper add permissions
        throw new Error(`This utility is not familiar with the issuer: ${issuer}

Please add permissions by manually editing the configuration file \`${init_1.CONFIG_FILE} in \`${org}/${repo}\`.

The configuration file reference can be found here: https://docs.saml.to/configuration/reference
`);
    }
}
exports.Add = Add;
//# sourceMappingURL=add.js.map