"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigHelper = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const js_yaml_1 = require("js-yaml");
const messages_1 = require("../messages");
const scms_1 = require("../stores/scms");
const command_1 = require("../command");
const github_init_1 = require("../commands/github-init");
const github_sls_rest_api_1 = require("../../api/github-sls-rest-api");
class ConfigHelper {
    scms;
    constructor() {
        this.scms = new scms_1.Scms();
    }
    async fetchConfigYaml(org, raw = false) {
        command_1.ui.updateBottomBar('Fetching config...');
        const accessToken = this.scms.getGithubToken();
        const idpApi = new github_sls_rest_api_1.IDPApi(new github_sls_rest_api_1.Configuration({
            accessToken: accessToken,
        }));
        const { data: result } = await idpApi.getOrgConfig(org, raw);
        return `---
${(0, js_yaml_1.dump)(result)}`;
    }
    async promptConfigUpdate(org, repo, 
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any
    config, title) {
        command_1.ui.updateBottomBar('');
        const configYaml = `
---
# Config Reference: 
# https://docs.saml.to/configuration/reference
${(0, js_yaml_1.dump)(config, { lineWidth: 1024 })}`;
        console.log(`Here is the updated \`${github_init_1.CONFIG_FILE}\` for ${org}/${repo}:

${configYaml}

`);
        command_1.ui.updateBottomBar('');
        const { type } = await inquirer_1.default.prompt({
            type: 'list',
            name: 'type',
            message: `Would you like to push this configuration change to \`${org}/${repo}\`?`,
            default: 'nothing',
            choices: [
                {
                    name: 'Do not change anything',
                    value: 'nothing',
                },
                {
                    name: `Commit directly to \`${org}/${repo}\``,
                    value: 'commit',
                },
            ],
        });
        if (type === 'nothing') {
            command_1.ui.updateBottomBar('');
            console.log('All done. No changes were made.');
            return false;
        }
        if (type === 'commit') {
            await this.commitConfig(org, repo, configYaml, title);
        }
        return true;
    }
    async commitConfig(org, repo, configYaml, title) {
        command_1.ui.updateBottomBar(`Updating ${github_init_1.CONFIG_FILE} on ${org}/${repo}`);
        const { github } = await this.scms.loadClients();
        if (!github) {
            throw new Error(messages_1.NO_GITHUB_CLIENT);
        }
        let sha;
        try {
            const response = await github.repos.getContent({
                owner: org,
                repo,
                path: github_init_1.CONFIG_FILE,
            });
            if (response.data && 'content' in response.data) {
                sha = response.data.sha;
            }
        }
        catch (e) {
            //Pass
        }
        const { data: update } = await github.repos.createOrUpdateFileContents({
            owner: org,
            repo,
            path: github_init_1.CONFIG_FILE,
            message: title,
            content: Buffer.from(configYaml, 'utf8').toString('base64'),
            sha,
        });
        command_1.ui.updateBottomBar('');
        console.log(`Updated \`${github_init_1.CONFIG_FILE}\` on \`${org}/${repo}\` (SHA: ${update.commit.sha})`);
    }
}
exports.ConfigHelper = ConfigHelper;
//# sourceMappingURL=configHelper.js.map