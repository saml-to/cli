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
class ConfigHelper {
    scms;
    constructor() {
        this.scms = new scms_1.Scms();
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
                    value: '',
                },
                {
                    name: `Commit directly to \`${org}/${repo}\``,
                    value: 'commit',
                },
            ],
        });
        if (type === 'commit') {
            return this.commitConfig(org, repo, configYaml, title);
        }
        command_1.ui.updateBottomBar('');
        console.log('All done. No changes were made.');
        return;
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