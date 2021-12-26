"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsSsoHelper = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const command_1 = require("../../command");
const configHelper_1 = require("../configHelper");
const genericHelper_1 = require("../genericHelper");
class AwsSsoHelper {
    configHelper;
    genericHelper;
    constructor() {
        this.configHelper = new configHelper_1.ConfigHelper();
        this.genericHelper = new genericHelper_1.GenericHelper();
    }
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any
    async promptProvider(org, repo, config) {
        switch (config.version) {
            case '20220101':
                return this.promptProviderV20220101(org, repo, config);
            default:
                throw new Error(`Unknown version ${config.version}`);
        }
    }
    async promptProviderV20220101(org, repo, config) {
        if (config.providers && config.providers['aws-sso']) {
            throw new Error('An `aws-sso` provider already exists, please manually edit the configuration to add another');
        }
        command_1.ui.updateBottomBar('');
        const { loginUrl } = await inquirer_1.default.prompt({
            type: 'input',
            name: 'loginUrl',
            message: `What is the AWS SSO Sign-in URL?`,
        });
        const { acsUrl } = await inquirer_1.default.prompt({
            type: 'input',
            name: 'acsUrl',
            message: `What is the AWS SSO ACS URL?`,
        });
        const { entityId } = await inquirer_1.default.prompt({
            type: 'input',
            name: 'entityId',
            message: `What is the AWS SSO issuer URL?`,
        });
        const newProvider = {
            ['aws-sso']: {
                entityId,
                acsUrl,
                loginUrl,
                attributes: {},
            },
        };
        config.providers = { ...(config.providers || {}), ...newProvider };
        const { addPermissions } = await inquirer_1.default.prompt({
            type: 'confirm',
            name: 'addPermissions',
            message: `Would you like to grant any permissions to GitHub users now?`,
        });
        if (!addPermissions) {
            return this.configHelper.promptConfigUpdate(org, repo, config, `aws-sso: add provider`);
        }
        return this.promptPermissionV20220101(org, repo, config);
    }
    async promptPermissionV20220101(org, repo, config) {
        config.permissions = config.permissions || {};
        config.permissions['aws-sso'] = config.permissions['aws-sso'] || {};
        config.permissions['aws-sso'].users = config.permissions['aws-sso'].users || {};
        config.permissions['aws-sso'].users.github = config.permissions['aws-sso'].users.github || [];
        const githubLogins = await this.genericHelper.promptUsers('aws-sso');
        const logins = new Set([...config.permissions['aws-sso'].users.github, ...githubLogins]);
        config.permissions['aws-sso'].users.github = [...logins];
        return this.configHelper.promptConfigUpdate(org, repo, config, `aws-sso: grant permissions to login

${githubLogins.map((l) => `- ${l}`)}`);
    }
}
exports.AwsSsoHelper = AwsSsoHelper;
//# sourceMappingURL=awsSsoHelper.js.map