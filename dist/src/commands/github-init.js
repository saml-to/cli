"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubInit = void 0;
// import { RequestError } from '@octokit/request-error';
// import { RequestError } from '@octokit/request-error';
const loglevel_1 = __importDefault(require("loglevel"));
const messages_1 = require("../messages");
const github_login_1 = require("./github-login");
const inquirer_1 = __importDefault(require("inquirer"));
const github_sls_rest_api_1 = require("../../api/github-sls-rest-api");
const scms_1 = require("../stores/scms");
const show_1 = require("./show");
const command_1 = require("../command");
const CONFIG_FILE = 'saml-to.yml';
const REPO_REGEX = /^.*github\.com[:/]+(?<org>.*)\/(?<repo>.*?)(.git)*$/gm;
// type ExampleConfig = {
//   name: string;
//   downloadUrl: string;
//   viewUrl?: string;
// };
// class NotFoundError extends Error {}
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
    async handle(scm, repoUrl, force = false) {
        if (scm !== 'github') {
            return false;
        }
        if (!repoUrl) {
            const { repoInput } = await inquirer_1.default.prompt({
                type: 'input',
                name: 'repoInput',
                message: `What is the full URL of the repository that will store the \`${CONFIG_FILE}\` configuration file?
`,
            });
            repoUrl = repoInput;
        }
        const { org, repo } = isGithubRepo(repoUrl);
        if (!org || !repo) {
            loglevel_1.default.debug('Not a github repo', repoUrl);
            return false;
        }
        command_1.ui.updateBottomBar(`Checking access to ${org}/${repo}...`);
        await this.assertRepo(org, repo, 'repo');
        command_1.ui.updateBottomBar(`Registering ${org}/${repo}...`);
        await this.registerRepo(org, repo, force);
        command_1.ui.updateBottomBar(`Fetching metadata...`);
        await this.show.fetchMetadataXml(org);
        this.scms.saveGithubOrg(org);
        command_1.ui.updateBottomBar('');
        console.log(`Repository ${org}/${repo} registered!`);
        // try {
        //   ui.updateBottomBar(`Checking for ${CONFIG_FILE} in ${org}/${repo}...`);
        //   await this.assertConfig(org, repo, CONFIG_FILE);
        // } catch (e) {
        //   if (e instanceof NotFoundError) {
        //     ui.updateBottomBar('');
        //     throw new Error(
        //       `${CONFIG_FILE} not found in ${org}/${repo}.\n\nComplete the setup instructions at https://saml.to, and then re-run this command.`,
        //     );
        //   }
        // }
        // ui.updateBottomBar(`Fetching and checking config...`);
        // await this.show.fetchConfig(org);
        // ui.updateBottomBar('');
        // inquirer.restoreDefaultPrompts();
        // console.log(`Configuration is valid!`);
        return true;
    }
    async assertRepo(org, repo, scope) {
        await this.githubLogin.assertScope(scope);
        const { github } = await this.scms.loadClients();
        if (!github) {
            throw new Error(messages_1.NO_GITHUB_CLIENT);
        }
        const { data: user } = await github.users.getAuthenticated();
        if (user.login.toLowerCase() !== org.toLowerCase()) {
            command_1.ui.updateBottomBar(`Checking membership on ${org}/${repo}...`);
            try {
                await github.orgs.checkMembershipForUser({ org, username: user.login });
            }
            catch (e) {
                if (e instanceof Error) {
                    command_1.ui.updateBottomBar('');
                    console.log((0, messages_1.GITHUB_ACCESS_NEEDED)(org, scope));
                    await this.githubLogin.handle('repo');
                    return this.assertRepo(org, repo, scope);
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
    // private async assertConfig(org: string, repo: string, file: string): Promise<void> {
    //   log.debug('Checking for config file', org, repo, file);
    //   const { github } = await this.scms.loadClients();
    //   if (!github) {
    //     throw new Error(NOT_LOGGED_IN);
    //   }
    //   try {
    //     await github.repos.getContent({ owner: org, repo, path: file });
    //   } catch (e) {
    //     if (e instanceof RequestError && e.status === 404) {
    //       throw new NotFoundError();
    //     }
    //     throw e;
    //   }
    // }
    // private async listExamples(): Promise<ExampleConfig[]> {
    //   log.debug('Fetching examples');
    //   ui.updateBottomBar('Fetching sample configurations...');
    //   const octokit = new Octokit();
    //   const { data: response } = await octokit.repos.getContent({
    //     owner: 'saml-to',
    //     repo: 'cli',
    //     path: 'examples',
    //   });
    //   if (!response || !Array.isArray(response)) {
    //     throw new Error(`Unable to list examples`);
    //   }
    //   return response.reduce((acc, file) => {
    //     if (file.type !== 'file') {
    //       return acc;
    //     }
    //     if (!file.name.endsWith(`.${CONFIG_FILE}`)) {
    //       return acc;
    //     }
    //     if (!file.download_url) {
    //       return acc;
    //     }
    //     const [name] = file.name.split(`.${CONFIG_FILE}`);
    //     const downloadUrl = file.download_url;
    //     const viewUrl = file.html_url || undefined;
    //     acc.push({ name, downloadUrl, viewUrl });
    //     return acc;
    //   }, [] as ExampleConfig[]);
    // }
    //   private async createConfig(org: string, repo: string, file = CONFIG_FILE): Promise<void> {
    //     ui.updateBottomBar('');
    //     const { createFile } = await inquirer.prompt({
    //       type: 'confirm',
    //       name: 'setupInstructions',
    //       message: `
    // It appears ${org}/${repo} does not have a configuration file named \`${file}\`.
    // Would you like to see setup instructions?
    // `,
    //     });
    //     if (!createFile) {
    //       throw new Error(`Config file ${file} does not exist in ${org}/${repo}`);
    //     }
    //     const examples = await this.listExamples();
    //     ui.updateBottomBar('');
    //     const { url } = await inquirer.prompt({
    //       type: 'list',
    //       message: `
    // Let's create your initial configuration.
    // We have some starter configurations here: https://github.com/saml-to/cli/tree/main/examples
    // Which configuration would you like to use?
    // Note:
    //  - We will show a preview of the configuration before committing the file
    //  - You can add or change the initial configuration later
    // `,
    //       name: 'url',
    //       choices: examples.map((example) => {
    //         return {
    //           name: `${example.name}`,
    //           value: example.downloadUrl,
    //         };
    //       }),
    //     });
    //     const { data: configYaml } = await axios.get(url);
    //     const config = load(configYaml) as GithubSlsRestApiConfigV20211212;
    //     if (config.version && config.version !== '20211212') {
    //       throw new Error(`Invalid config version: ${config.version}`);
    //     }
    //     const { variables } = config;
    //     if (variables) {
    //       const prompts = Object.entries(variables).filter(([, value]) => {
    //         if (!value) {
    //           return true;
    //         }
    //         return false;
    //       });
    //       // console.log(`There's ${prompts.length} input variables that need to be specified.`);
    //       const answers = await inquirer.prompt(
    //         prompts.map(([key]) => {
    //           return { type: 'string', name: key };
    //         }),
    //       );
    //       config.variables = Object.entries(answers).reduce((acc, [key, value]) => {
    //         acc[key] = `${value}`;
    //         return acc;
    //       }, {} as { [key: string]: GithubSlsRestApiVariableV1 });
    //     }
    //     const { github } = await this.scms.loadClients();
    //     if (!github) {
    //       throw new Error(NOT_LOGGED_IN);
    //     }
    //     const { data: user } = await github.users.getAuthenticated();
    //     const { permissions } = config;
    //     if (permissions) {
    //       Object.entries(permissions).forEach(([, permission]) => {
    //         if (permission.users) {
    //           permission.users.github = [user.login];
    //         }
    //         if (permission.roles) {
    //           Object.entries(permission.roles).forEach(([, permissionRole]) => {
    //             if (permissionRole.users) {
    //               permissionRole.users.github = [user.login];
    //             }
    //           });
    //         }
    //       });
    //     }
    //     const newConfigYaml = `---\n${dump(config, { lineWidth: 1024 })}\n`;
    //     console.log("Here's your new configuration:\n\n");
    //     console.log(`${newConfigYaml}\n\n`);
    //     const commitResponse = await inquirer.prompt({
    //       type: 'confirm',
    //       name: 'commit',
    //       message: `
    // Here's the new configuration:
    // ${newConfigYaml}
    // Would you like to add it to \`${org}/${repo}\` at \`./${file}\`
    // `,
    //     });
    //     if (!commitResponse.commit) {
    //       const outputPath = `${this.scms.configDir}/saml-to.yml`;
    //       fs.writeFileSync(outputPath, newConfigYaml);
    //       console.log(`Generated config file saved to \`${outputPath}\`.`);
    //       throw new Error(
    //         'Please run the `saml-to init` command again once the file has been placed in the repo.',
    //       );
    //     }
    //     await github.repos.createOrUpdateFileContents({
    //       owner: org,
    //       repo,
    //       path: file,
    //       message: '[saml-to cli] saml.to configuration file',
    //       content: Buffer.from(newConfigYaml, 'utf8').toString('base64'),
    //     });
    //     ui.updateBottomBar(`Committed ${file} to ${org}/${repo}!`);
    //   }
    async registerRepo(org, repo, force) {
        const accessToken = this.scms.getGithubToken();
        const idpApi = new github_sls_rest_api_1.IDPApi(new github_sls_rest_api_1.Configuration({
            accessToken: accessToken,
        }));
        const { data: result } = await idpApi.setOrgAndRepo(org, repo, force);
        loglevel_1.default.debug('Initialized repo', result);
    }
}
exports.GithubInit = GithubInit;
//# sourceMappingURL=github-init.js.map