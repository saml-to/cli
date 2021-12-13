"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubInit = void 0;
// import { RequestError } from '@octokit/request-error';
const request_error_1 = require("@octokit/request-error");
const loglevel_1 = __importDefault(require("loglevel"));
const messages_1 = require("../messages");
const github_login_1 = require("./github-login");
const rest_1 = require("@octokit/rest");
const inquirer_1 = __importDefault(require("inquirer"));
const axios_1 = __importDefault(require("axios"));
const js_yaml_1 = require("js-yaml");
const github_sls_rest_api_1 = require("../../api/github-sls-rest-api");
const fs_1 = __importDefault(require("fs"));
const scms_1 = require("../stores/scms");
const show_1 = require("./show");
const command_1 = require("../command");
process.on('SIGINT', () => {
    process.exit(0);
});
const CONFIG_FILE = 'saml-to.yml';
const REPO_REGEX = /^.*github\.com[:/]+(?<org>.*)\/(?<repo>.*?)(.git)*$/gm;
class NotFoundError extends Error {
}
const isGithubRepo = (repoUrl) => {
    const match = REPO_REGEX.exec(repoUrl);
    if (!match || !match.groups) {
        return {};
    }
    return {
        org: match.groups.org,
        repo: match.groups.repo,
    };
};
class GithubInit {
    githubLogin;
    scms;
    show;
    constructor() {
        this.githubLogin = new github_login_1.GithubLogin();
        this.scms = new scms_1.Scms();
        this.show = new show_1.Show();
    }
    async handle(repoUrl) {
        const { org, repo } = isGithubRepo(repoUrl);
        if (!org || !repo) {
            loglevel_1.default.debug('Not a github repo', repoUrl);
            return false;
        }
        // console.log(`It appears that ${file} does not exist in ${org}/${repo}`);
        //     const response = await inquirer.prompt({
        //       type: 'confirm',
        //       name: 'createFile',
        //       message: 'Would you like me to setup a configuration file for you?',
        //     });
        //     if (!response.createFile) {
        //       throw new Error(`Config file ${file} does not exist in ${org}/${repo}`);
        //     }
        //     await this.createConfig(user.login, org, repo, file);
        await this.assertRepo(org, repo);
        try {
            await this.assertConfig(org, repo);
        }
        catch (e) {
            if (e instanceof NotFoundError) {
                await this.createConfig(org, repo);
            }
        }
        await this.registerRepo(org, repo);
        command_1.ui.updateBottomBar(`Fetching and checking config...`);
        await this.show.fetchConfig(org);
        command_1.ui.updateBottomBar(`Fetching metadata...`);
        await this.show.fetchMetadataXml(org);
        command_1.ui.updateBottomBar('');
        inquirer_1.default.restoreDefaultPrompts();
        console.log(`Configuration is valid!`);
        return true;
    }
    async assertRepo(org, repo) {
        loglevel_1.default.debug('Checking for access to', org, repo);
        command_1.ui.updateBottomBar(`Checking access to ${org}/${repo}...`);
        const { github } = await this.scms.loadClients();
        if (!github) {
            throw new Error(messages_1.NOT_LOGGED_IN);
        }
        const { data: user, headers } = await github.users.getAuthenticated();
        try {
            this.assertScopes(headers, 'repo');
        }
        catch (e) {
            if (e instanceof Error) {
                loglevel_1.default.debug(e.message);
                console.log((0, messages_1.GITHUB_ACCESS_NEEDED)(org));
                await this.githubLogin.handle('repo');
                return this.assertRepo(org, repo);
            }
            throw e;
        }
        if (user.login.toLowerCase() !== org.toLowerCase()) {
            command_1.ui.updateBottomBar(`Checking membership on ${org}/${repo}...`);
            try {
                await github.orgs.checkMembershipForUser({ org, username: user.login });
            }
            catch (e) {
                if (e instanceof Error) {
                    loglevel_1.default.debug(e.message);
                    console.log((0, messages_1.GITHUB_ACCESS_NEEDED)(org));
                    await this.githubLogin.handle('repo');
                    return this.assertRepo(org, repo);
                }
            }
        }
        command_1.ui.updateBottomBar(`Checking access to ${org}/${repo}...`);
        try {
            await github.repos.get({ owner: org, repo });
        }
        catch (e) {
            if (e instanceof Error) {
                loglevel_1.default.debug(e.message);
                throw new Error((0, messages_1.REPO_DOES_NOT_EXIST)(org, repo));
            }
        }
    }
    assertScopes(headers, expectedScope) {
        const xOauthScopes = headers['x-oauth-scopes'];
        loglevel_1.default.debug('Current scopes:', xOauthScopes);
        const scopes = xOauthScopes.split(' ');
        if (scopes.includes(expectedScope)) {
            return;
        }
        throw new Error(`Missing scope. Expected:${expectedScope} Actual:${scopes}`);
    }
    async assertConfig(org, repo, file = CONFIG_FILE) {
        loglevel_1.default.debug('Checking for config file', org, repo, file);
        const { github } = await this.scms.loadClients();
        if (!github) {
            throw new Error(messages_1.NOT_LOGGED_IN);
        }
        command_1.ui.updateBottomBar(`Fetching ${file} on ${org}/${repo}...`);
        try {
            await github.repos.getContent({ owner: org, repo, path: file });
            command_1.ui.updateBottomBar(`Found ${file} in ${org}/${repo}!`);
        }
        catch (e) {
            if (e instanceof request_error_1.RequestError && e.status === 404) {
                command_1.ui.updateBottomBar(`${file} was not found in ${org}/${repo}!`);
                throw new NotFoundError();
            }
            throw e;
        }
    }
    async listExamples() {
        loglevel_1.default.debug('Fetching examples');
        command_1.ui.updateBottomBar('Fetching sample configurations...');
        const octokit = new rest_1.Octokit();
        const { data: response } = await octokit.repos.getContent({
            owner: 'saml-to',
            repo: 'cli',
            path: 'examples',
        });
        if (!response || !Array.isArray(response)) {
            throw new Error(`Unable to list examples`);
        }
        return response.reduce((acc, file) => {
            if (file.type !== 'file') {
                return acc;
            }
            if (!file.name.endsWith(`.${CONFIG_FILE}`)) {
                return acc;
            }
            if (!file.download_url) {
                return acc;
            }
            const [name] = file.name.split(`.${CONFIG_FILE}`);
            const downloadUrl = file.download_url;
            const viewUrl = file.html_url || undefined;
            acc.push({ name, downloadUrl, viewUrl });
            return acc;
        }, []);
    }
    async createConfig(org, repo, file = CONFIG_FILE) {
        command_1.ui.updateBottomBar('');
        const { createFile } = await inquirer_1.default.prompt({
            type: 'confirm',
            name: 'createFile',
            message: `
It appears ${org}/${repo} does not have a configuration file named \`${file}\`.

Would you a configuration file set up?
`,
        });
        if (!createFile) {
            throw new Error(`Config file ${file} does not exist in ${org}/${repo}`);
        }
        const examples = await this.listExamples();
        command_1.ui.updateBottomBar('');
        const { url } = await inquirer_1.default.prompt({
            type: 'list',
            message: `
Let's create your initial configuration.

We have some starter configurations here: https://github.com/saml-to/cli/tree/main/examples

Which configuration would you like to use?

Note:
 - We will show a preview of the configuration before committing the file
 - You can add or change the initial configuration later
`,
            name: 'url',
            choices: examples.map((example) => {
                return {
                    name: `${example.name}`,
                    value: example.downloadUrl,
                };
            }),
        });
        const { data: configYaml } = await axios_1.default.get(url);
        const config = (0, js_yaml_1.load)(configYaml);
        if (config.version && config.version !== '20211212') {
            throw new Error(`Invalid config version: ${config.version}`);
        }
        const { variables } = config;
        if (variables) {
            const prompts = Object.entries(variables).filter(([, value]) => {
                if (!value) {
                    return true;
                }
                return false;
            });
            // console.log(`There's ${prompts.length} input variables that need to be specified.`);
            const answers = await inquirer_1.default.prompt(prompts.map(([key]) => {
                return { type: 'string', name: key };
            }));
            config.variables = Object.entries(answers).reduce((acc, [key, value]) => {
                acc[key] = `${value}`;
                return acc;
            }, {});
        }
        const { github } = await this.scms.loadClients();
        if (!github) {
            throw new Error(messages_1.NOT_LOGGED_IN);
        }
        const { data: user } = await github.users.getAuthenticated();
        const { permissions } = config;
        if (permissions) {
            Object.entries(permissions).forEach(([, permission]) => {
                if (permission.users) {
                    permission.users.github = [user.login];
                }
                if (permission.roles) {
                    Object.entries(permission.roles).forEach(([, permissionRole]) => {
                        if (permissionRole.users) {
                            permissionRole.users.github = [user.login];
                        }
                    });
                }
            });
        }
        const newConfigYaml = `---\n${(0, js_yaml_1.dump)(config, { lineWidth: 1024 })}\n`;
        console.log("Here's your new configuration:\n\n");
        console.log(`${newConfigYaml}\n\n`);
        const commitResponse = await inquirer_1.default.prompt({
            type: 'confirm',
            name: 'commit',
            message: `
Here's the new configuration:

${newConfigYaml}

Would you like to add it to \`${org}/${repo}\` at \`./${file}\`
`,
        });
        if (!commitResponse.commit) {
            const outputPath = `${this.scms.configDir}/saml-to.yml`;
            fs_1.default.writeFileSync(outputPath, newConfigYaml);
            console.log(`Generated config file saved to \`${outputPath}\`.`);
            throw new Error('Please run the `saml-to init` command again once the file has been placed in the repo.');
        }
        await github.repos.createOrUpdateFileContents({
            owner: org,
            repo,
            path: file,
            message: '[saml-to cli] saml.to configuration file',
            content: Buffer.from(newConfigYaml, 'utf8').toString('base64'),
        });
        command_1.ui.updateBottomBar(`Committed ${file} to ${org}/${repo}!`);
    }
    async registerRepo(org, repo) {
        command_1.ui.updateBottomBar(`Registering ${org}/${repo} with the backend...`);
        const accessToken = this.scms.getGithubToken();
        const idpApi = new github_sls_rest_api_1.IDPApi(new github_sls_rest_api_1.Configuration({
            accessToken: accessToken,
        }));
        const { data: result } = await idpApi.setOrgAndRepo(org, repo);
        loglevel_1.default.debug('Initialized repo', result);
    }
}
exports.GithubInit = GithubInit;
//# sourceMappingURL=github-init.js.map