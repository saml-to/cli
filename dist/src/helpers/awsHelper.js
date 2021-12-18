"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsHelper = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const command_1 = require("../command");
const configHelper_1 = require("./configHelper");
const genericHelper_1 = require("./genericHelper");
class AwsHelper {
    configHelper;
    genericHelper;
    constructor() {
        this.configHelper = new configHelper_1.ConfigHelper();
        this.genericHelper = new genericHelper_1.GenericHelper();
    }
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any
    async promptProvider(org, repo, config) {
        switch (config.version) {
            case '20211212':
                return this.promptProviderV20211212(org, repo, config);
            default:
                throw new Error(`Unknown version ${config.version}`);
        }
    }
    async promptProviderV20211212(org, repo, config) {
        if (config.providers && config.providers.aws) {
            throw new Error('An `aws` provider already exists, please manually edit the configuration to add another');
        }
        if (config.variables && config.variables.awsAccountId) {
            throw new Error('An `awsAccountId` variable already exists, please manually edit the configuration to add this provider');
        }
        command_1.ui.updateBottomBar('');
        const { accountId } = await inquirer_1.default.prompt({
            type: 'input',
            name: 'accountId',
            message: `What is your AWS Account ID?`,
        });
        const newVariables = {
            awsAccountId: `${accountId}`,
        };
        const newProvider = {
            aws: {
                audience: 'https://signin.aws.amazon.com/saml',
                acs: 'https://signin.aws.amazon.com/saml',
                issuer: 'https://signin.aws.amazon.com/saml',
                nameId: '<#= user.github.login #>',
                attributes: {
                    'https://aws.amazon.com/SAML/Attributes/RoleSessionName': '<#= user.github.login #>',
                    'https://aws.amazon.com/SAML/Attributes/SessionDuration': '3600',
                    'https://aws.amazon.com/SAML/Attributes/Role': '<#= user.selectedRole #>,arn:aws:iam::<$= awsAccountId $>:saml-provider/saml.to',
                },
            },
        };
        config.variables = { ...(config.variables || {}), ...newVariables };
        config.providers = { ...(config.providers || {}), ...newProvider };
        return this.configHelper.promptConfigUpdate(org, repo, config, `add aws provider`);
    }
    async promptPermissionV20211212(org, repo, config) {
        config.permissions = config.permissions || {};
        config.permissions.aws = config.permissions.aws || {};
        config.permissions.aws.roles = config.permissions.aws.roles || [];
        command_1.ui.updateBottomBar('');
        let roleArn;
        roleArn = (await inquirer_1.default.prompt({
            type: 'list',
            name: 'roleArn',
            message: `What is role you would like to allow for assumption?`,
            choices: [
                ...config.permissions.aws.roles.map((r) => ({ name: r.name })),
                { name: 'Add another role', value: '' },
            ],
        })).roleArn;
        if (!roleArn) {
            const { arnInput } = await inquirer_1.default.prompt({
                type: 'input',
                name: 'arnInput',
                message: `What is ARN of the new role you would like to allow for assumption?
`,
                validate: (input) => {
                    if (!input) {
                        console.error('Invalid ARN!');
                        return false;
                    }
                    // TODO ARN Validator
                    return true;
                },
            });
            roleArn = arnInput;
        }
        const githubLogins = await this.genericHelper.promptUsers('aws', roleArn);
        const roleIx = config.permissions.aws.roles.findIndex((r) => r.name && r.name.toLowerCase() === roleArn.toLowerCase());
        if (roleIx === -1) {
            config.permissions.aws.roles.push({ name: roleArn, users: { github: githubLogins } });
        }
        else {
            if (!config.permissions.aws.roles[roleIx].users) {
                config.permissions.aws.roles[roleIx].users = { github: githubLogins };
            }
            else {
                // Merge
                config.permissions.aws.roles[roleIx].users = {
                    ...config.permissions.aws.roles[roleIx].users,
                    github: [
                        ...((config.permissions.aws.roles[roleIx].users || {}).github || []),
                        ...githubLogins,
                    ],
                };
            }
        }
        return this.configHelper.promptConfigUpdate(org, repo, config, `grant aws permissions to role ${roleArn}

${githubLogins.map((l) => `- ${l}`)}`);
    }
}
exports.AwsHelper = AwsHelper;
//# sourceMappingURL=awsHelper.js.map