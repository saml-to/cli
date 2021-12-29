"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Set = void 0;
const github_sls_rest_api_1 = require("../../api/github-sls-rest-api");
const js_yaml_1 = require("js-yaml");
const configHelper_1 = require("../helpers/configHelper");
const command_1 = require("../command");
const orgHelper_1 = require("../helpers/orgHelper");
const scms_1 = require("../stores/scms");
class Set {
    orgHelper;
    configHelper;
    scms;
    constructor() {
        this.orgHelper = new orgHelper_1.OrgHelper();
        this.configHelper = new configHelper_1.ConfigHelper();
        this.scms = new scms_1.Scms();
    }
    handle = async (subcommand, provider, opts) => {
        console.log('!!!!', subcommand, provider, opts);
        switch (subcommand) {
            case 'provisioning': {
                await this.promptProvisioning(provider, opts);
                break;
            }
            default:
                throw new Error(`Unknown subcommand: ${subcommand}`);
        }
    };
    promptProvisioning = async (provider, opts) => {
        const { type } = opts;
        if (!type) {
            throw new Error(`Missing provisioning type`);
        }
        switch (type) {
            case 'scim': {
                return this.promptScimProvisioning(provider, opts);
            }
            default:
                throw new Error(`Unknown provisioning type: ${type}`);
        }
    };
    promptScimProvisioning = async (provider, opts) => {
        const { org, repo } = await this.orgHelper.promptOrg('log in');
        command_1.ui.updateBottomBar('Fetching config...');
        const configYaml = await this.configHelper.fetchConfigYaml(org, true);
        const config = (0, js_yaml_1.load)(configYaml);
        if (!config.version) {
            throw new Error(`Missing version in config`);
        }
        let added;
        switch (config.version) {
            case '20220101': {
                added = await this.promptScimProvisioningV20220101(org, repo, provider, config, opts.endpoint, opts.token);
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
    };
    promptScimProvisioningV20220101 = async (org, repo, provider, config, endpoint, token) => {
        if (!endpoint || !token) {
            // TODO: prompt for them!
            throw new Error(`Missing endpoint or token`);
        }
        const { providers } = config;
        if (!providers) {
            throw new Error(`Missing providers in config`);
        }
        const providerConfig = providers[provider];
        if (!providerConfig) {
            throw new Error(`Unknown provider: ${provider}`);
        }
        const accessToken = this.scms.getGithubToken();
        const idpApi = new github_sls_rest_api_1.IDPApi(new github_sls_rest_api_1.Configuration({
            accessToken,
        }));
        command_1.ui.updateBottomBar('Encrypting token...');
        const { data } = await idpApi.encrypt(org, { value: token });
        const { encryptedValue } = data;
        providerConfig.provisioning = { scim: { endpoint, encryptedToken: encryptedValue } };
        return this.configHelper.promptConfigUpdate(org, repo, config, `${provider}: set provisioning`);
    };
}
exports.Set = Set;
//# sourceMappingURL=set.js.map