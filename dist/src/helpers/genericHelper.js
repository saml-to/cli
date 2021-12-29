"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericHelper = exports.trainCase = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const command_1 = require("../command");
const configHelper_1 = require("./configHelper");
const scms_1 = require("../stores/scms");
const trainCase = (str) => {
    if (!str) {
        return '';
    }
    const match = str.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g);
    if (!match) {
        return '';
    }
    return match.map((x) => x.toLowerCase()).join('-');
};
exports.trainCase = trainCase;
class GenericHelper {
    configHelper;
    scms;
    constructor() {
        this.configHelper = new configHelper_1.ConfigHelper();
        this.scms = new scms_1.Scms();
    }
    async promptUsers(provider, role, users) {
        if (!users) {
            command_1.ui.updateBottomBar('');
            const { addSelf } = await inquirer_1.default.prompt({
                type: 'confirm',
                name: 'addSelf',
                message: `Would you like to grant yourself access to ${role ? `assume \`${role}\`` : `login to ${provider}`}?
  `,
            });
            if (addSelf) {
                const login = await this.scms.getLogin();
                users = [login];
            }
            else {
                users = [];
            }
        }
        command_1.ui.updateBottomBar('');
        const { user } = await inquirer_1.default.prompt({
            type: 'input',
            name: 'user',
            message: `What is another Github ID of the user that will be allowed to ${role ? `assume \`${role}\`` : `login to ${provider}`}? (Leave blank if finished adding users)
`,
        });
        if (!user) {
            return users || [];
        }
        users.push(user);
        return this.promptUsers(provider, role, [...new Set(users)]);
    }
    async promptProvider(org, repo, 
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any
    config, name, entityId, acsUrl, loginUrl, nameId, nameIdFormat, attributes) {
        command_1.ui.updateBottomBar('');
        if (!name) {
            name = (await inquirer_1.default.prompt({
                type: 'input',
                name: 'name',
                message: `What is the name of the provider (e.g. AWS, Slack, Google)?`,
            })).name;
        }
        if (!name) {
            throw new Error('Name is required');
        }
        switch (config.version) {
            case '20220101':
                return this.promptProviderV20220101((0, exports.trainCase)(name), org, repo, config, entityId, acsUrl, loginUrl, nameId, nameIdFormat, attributes);
            default:
                throw new Error(`Unknown version ${config.version}`);
        }
    }
    async promptProviderV20220101(name, org, repo, config, entityId, acsUrl, loginUrl, nameId, nameIdFormat, attributes) {
        if (config.providers && config.providers[name]) {
            throw new Error(`An provider named \`${name}\` already exists, please manually edit the configuration to add another`);
        }
        command_1.ui.updateBottomBar('');
        if (!entityId) {
            entityId = (await inquirer_1.default.prompt({
                type: 'input',
                name: 'entityId',
                message: `What is the Entity ID for ${name}?`,
            })).entityId;
        }
        if (!acsUrl) {
            acsUrl = (await inquirer_1.default.prompt({
                type: 'input',
                name: 'acsUrl',
                message: `What is the Assertion Consumer Service (ACS) URL for ${name}?`,
            })).acsUrl;
        }
        if (!loginUrl) {
            loginUrl = (await inquirer_1.default.prompt({
                type: 'input',
                name: 'loginUrl',
                message: `What is the Login URL for ${name}?`,
            })).loginUrl;
        }
        if (!nameIdFormat) {
            nameIdFormat = (await inquirer_1.default.prompt({
                type: 'list',
                name: 'nameIdFormat',
                message: `(Optional) Does the provider need Name IDs in a particular format?
  `,
                choices: [
                    {
                        name: 'Persistent (GitHub User ID)',
                        value: 'id',
                    },
                    {
                        name: 'Transient (Github Login/Username)',
                        value: 'login',
                    },
                    {
                        name: 'Email (GitHub User Email)',
                        value: 'email',
                    },
                    { name: 'None', value: 'none' },
                ],
            })).nameIdFormat;
        }
        // TODO Prompt for certificate
        let idFormat;
        if (nameIdFormat && nameIdFormat !== 'none') {
            idFormat = nameIdFormat;
        }
        if (!attributes || Object.keys(attributes).length === 0) {
            attributes = await this.promptAttributes(config.variables || {});
        }
        const newProvider = {
            [`${name}`]: {
                entityId,
                loginUrl,
                nameId,
                nameIdFormat: idFormat,
                acsUrl,
                attributes,
            },
        };
        config.providers = { ...(config.providers || {}), ...newProvider };
        const { addPermissions } = await inquirer_1.default.prompt({
            type: 'confirm',
            name: 'addPermissions',
            message: `Would you like to grant any permissions to GitHub users now?`,
        });
        if (!addPermissions) {
            return this.configHelper.promptConfigUpdate(org, repo, config, `${name}: add provider`);
        }
        return this.promptPermissionV20220101(org, repo, name, config);
    }
    async promptPermissionV20220101(org, repo, provider, config) {
        config.permissions = config.permissions || {};
        config.permissions[provider] = config.permissions[provider] || {};
        config.permissions[provider].users = config.permissions[provider].users || {};
        (config.permissions[provider].users || {}).github =
            (config.permissions[provider].users || {}).github || [];
        const githubLogins = await this.promptUsers(provider);
        const logins = new Set([
            ...((config.permissions[provider].users || {}).github || []),
            ...githubLogins,
        ]);
        (config.permissions[provider].users || {}).github = [...logins];
        return this.configHelper.promptConfigUpdate(org, repo, config, `${provider}: grant permissions to login

${githubLogins.map((l) => `- ${l}`)}`);
    }
    outputEnv(vars, platform = process.platform) {
        let prefix = 'export';
        let separator = '=';
        switch (platform) {
            case 'win32':
                prefix = 'setx';
                break;
            case 'github':
                prefix = '::set-output';
                separator = '::';
                break;
            default:
                break;
        }
        Object.entries(vars).forEach(([key, value]) => {
            console.log(`${prefix} ${key}${separator}"${value}"`);
        });
    }
    async promptAttributes(variables, attributes = {}) {
        const { attributeName } = await inquirer_1.default.prompt({
            type: 'input',
            name: 'attributeName',
            message: `What is the name of an attribute should be sent to the Provider? (Leave blank if finished adding attributes)
`,
        });
        if (!attributeName) {
            return attributes;
        }
        let { attributeValue } = await inquirer_1.default.prompt({
            type: 'list',
            name: 'attributeValue',
            message: `What should be the value of \`${attributeName}\`?
`,
            choices: [
                {
                    name: 'Github User ID',
                    value: '<#= user.github.id #>',
                },
                {
                    name: 'Github Login/Username',
                    value: '<#= user.github.login #>',
                },
                {
                    name: 'Email Address',
                    value: '<#= user.github.email #>',
                },
                {
                    name: 'Full Name',
                    value: '<#= user.github.fullName #>',
                },
                {
                    name: 'First Name',
                    value: '<#= user.github.firstName #>',
                },
                {
                    name: 'Last Name',
                    value: '<#= user.github.lastName #>',
                },
                {
                    name: 'The selected role (for `assume` commands)',
                    value: '<#= selectedRole #>',
                },
                {
                    name: 'Session ID (randomly generated for each login)',
                    value: '<#= sessionId #>',
                },
                ...Object.keys(variables).map((k) => {
                    return { name: `Variable: ${k}`, value: `<$= ${k} $>` };
                }),
                { name: 'Other', value: '*_*_*_OTHER_*_*_*' },
            ],
        });
        if (attributeValue === '*_*_*_OTHER_*_*_*') {
            const { customValue } = await inquirer_1.default.prompt({
                type: 'input',
                name: 'customValue',
                message: `What is the custom value of ${attributeName}?
`,
            });
            attributeValue = customValue;
        }
        attributes[attributeName] = attributeValue;
        return this.promptAttributes(variables, attributes);
    }
}
exports.GenericHelper = GenericHelper;
//# sourceMappingURL=genericHelper.js.map