'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.GithubInit = exports.CONFIG_FILE = void 0;
// import { RequestError } from '@octokit/request-error';
// import { RequestError } from '@octokit/request-error';
const loglevel_1 = __importDefault(require('loglevel'));
const messages_1 = require('../messages');
const github_login_1 = require('./github-login');
const inquirer_1 = __importDefault(require('inquirer'));
const github_sls_rest_api_1 = require('../../api/github-sls-rest-api');
const scms_1 = require('../stores/scms');
const show_1 = require('./show');
const command_1 = require('../command');
const request_error_1 = require('@octokit/request-error');
const js_yaml_1 = require('js-yaml');
const rest_1 = require('@octokit/rest');
exports.CONFIG_FILE = 'saml-to.yml';
const EMPTY_CONFIG = {
  version: github_sls_rest_api_1.GithubSlsRestApiConfigV20220101VersionEnum._20220101,
  variables: {},
  providers: {},
  permissions: {},
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
  async handle(force = false) {
    command_1.ui.updateBottomBar('');
    console.log(`Welcome to SAML.to!

SAML.to enables administrators to grant access to Service Providers to GitHub users.

This utility will assist you in connecting a new or existing repository of your choice for configuration.

SAML.to is configured by adding a \`${exports.CONFIG_FILE}\` to any GitHub organization and repository which defines providers and access privleges.

Once configured, you (or users in your organzation) will be able to login to services (and assume roles, if supported) using this utility or from the web.

For more information, check out https://docs.saml.to
`);
    command_1.ui.updateBottomBar('');
    const { org } = await inquirer_1.default.prompt({
      type: 'input',
      name: 'org',
      message: `Which GitHub User or Organiztion would you like to use?
`,
    });
    command_1.ui.updateBottomBar(`Checking if ${org} exists...`);
    await this.assertOrg(org);
    command_1.ui.updateBottomBar('');
    const { repo } = await inquirer_1.default.prompt({
      type: 'input',
      name: 'repo',
      default: 'saml-to',
      message: `Which Repository within ${org} would you like to use to store the \`${exports.CONFIG_FILE}\` configuration file?
(If it doesn't yet exist, we'll give you an option to create it!)
`,
    });
    command_1.ui.updateBottomBar(`Checking access to ${org}/${repo}...`);
    await this.assertRepo(org, repo, 'repo');
    command_1.ui.updateBottomBar(`Registering ${org}/${repo}...`);
    await this.registerRepo(org, repo, force);
    command_1.ui.updateBottomBar(`Fetching metadata...`);
    await this.show.fetchMetadataXml(org);
    this.scms.saveGithubOrg(org);
    command_1.ui.updateBottomBar('');
    console.log(`Repository \`${org}/${repo}\` registered!`);
    return true;
  }
  async assertOrg(org) {
    const octokit = new rest_1.Octokit();
    try {
      const { data: user } = await octokit.users.getByUsername({ username: org });
      if (user.type === 'User') {
        return 'User';
      }
      if (user.type === 'Organization') {
        return 'Organization';
      }
      throw new Error(
        `Unknown user type for \`${org}\`: ${user.type}, must be 'User' or 'Organization'`,
      );
    } catch (e) {
      if (e instanceof request_error_1.RequestError && e.status === 404) {
        throw new Error(`Unable to find user or organization: ${org}`);
      }
      throw e;
    }
  }
  async assertRepo(org, repo, scope) {
    await this.githubLogin.assertScope(scope);
    const { github } = await this.scms.loadClients();
    if (!github) {
      await this.githubLogin.handle(scope);
      return this.assertRepo(org, repo, scope);
    }
    const { data: user } = await github.users.getAuthenticated();
    if (user.login.toLowerCase() !== org.toLowerCase()) {
      command_1.ui.updateBottomBar(`Checking membership on ${org}/${repo}...`);
      try {
        await github.orgs.checkMembershipForUser({ org, username: user.login });
      } catch (e) {
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
      const { data: repository } = await github.repos.get({ owner: org, repo });
      if (repository.visibility === 'public') {
        command_1.ui.updateBottomBar('');
        const { makePrivate } = await inquirer_1.default.prompt({
          type: 'confirm',
          name: 'makePrivate',
          message: `\`${org}/${repo}\` appears to be a Public Repository. It's recommended to keep it private. Would you like to convert it to a private repository?`,
        });
        if (makePrivate) {
          await github.repos.update({ owner: org, repo, visibility: 'private' });
        } else {
          console.warn(`WARN: ${org}/${repo} is publicly visible, but it does not need to be!`);
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        command_1.ui.updateBottomBar('');
        const { createRepo } = await inquirer_1.default.prompt({
          type: 'confirm',
          name: 'createRepo',
          message: `It appears that \`${org}/${repo}\` does not exist yet, do you want to create it?`,
        });
        if (!createRepo) {
          throw new Error((0, messages_1.REPO_DOES_NOT_EXIST)(org, repo));
        }
        command_1.ui.updateBottomBar(`Creating repository ${org}/${repo}...`);
        if (user.login.toLowerCase() !== org.toLowerCase()) {
          await github.repos.createInOrg({ name: repo, org, visibility: 'private' });
        } else {
          await github.repos.createForAuthenticatedUser({ name: repo, visibility: 'private' });
        }
        return this.assertRepo(org, repo, scope);
      }
    }
    command_1.ui.updateBottomBar(`Checking for existing config...`);
    try {
      await github.repos.getContent({ owner: org, repo, path: exports.CONFIG_FILE });
    } catch (e) {
      if (e instanceof request_error_1.RequestError && e.status === 404) {
        command_1.ui.updateBottomBar('');
        const { createConfig } = await inquirer_1.default.prompt({
          type: 'confirm',
          name: 'createConfig',
          message: `It appears that \`${org}/${repo}\` does not contain \`${exports.CONFIG_FILE}\` yet. Would you like to create an empty config file?`,
        });
        if (!createConfig) {
          console.warn(
            `Skipping creation of \`${exports.CONFIG_FILE}\`, please be sure to create it!`,
          );
          return;
        }
        await github.repos.createOrUpdateFileContents({
          owner: org,
          repo,
          content: Buffer.from(
            `---
${(0, js_yaml_1.dump)(EMPTY_CONFIG)}
`,
            'utf8',
          ).toString('base64'),
          message: `initial saml.to configuration`,
          path: exports.CONFIG_FILE,
        });
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
  //     const config = load(configYaml) as GithubSlsRestApiConfigV20220101;
  //     if (config.version && config.version !== '20220101') {
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
    const idpApi = new github_sls_rest_api_1.IDPApi(
      new github_sls_rest_api_1.Configuration({
        accessToken: accessToken,
      }),
    );
    const { data: result } = await idpApi.setOrgAndRepo(org, repo, force);
    loglevel_1.default.debug('Initialized repo', result);
  }
}
exports.GithubInit = GithubInit;
//# sourceMappingURL=github-init.js.map
