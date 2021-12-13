// import { RequestError } from '@octokit/request-error';
import { RequestError } from '@octokit/request-error';
import log from 'loglevel';
import { GITHUB_ACCESS_NEEDED, NOT_LOGGED_IN, REPO_DOES_NOT_EXIST } from '../messages';
import { GithubLogin } from './github-login';
import { Octokit } from '@octokit/rest';
import inquirer from 'inquirer';
import axios from 'axios';
import { load, dump } from 'js-yaml';
import {
  GithubSlsRestApiConfigV20211212,
  GithubSlsRestApiVariableV1,
  IDPApi,
  Configuration,
} from '../../api/github-sls-rest-api';
import fs from 'fs';
import { Scms } from '../stores/scms';
import { Show } from './show';
import { ui } from '../command';

process.on('SIGINT', () => {
  process.exit(0);
});

const CONFIG_FILE = 'saml-to.yml';
const REPO_REGEX = /^.*github\.com[:/]+(?<org>.*)\/(?<repo>.*?)(.git)*$/gm;

type ExampleConfig = {
  name: string;
  downloadUrl: string;
  viewUrl?: string;
};

class NotFoundError extends Error {}

const isGithubRepo = (repoUrl: string): { org?: string; repo?: string } => {
  const match = REPO_REGEX.exec(repoUrl);
  if (!match || !match.groups) {
    return {};
  }

  return {
    org: match.groups.org,
    repo: match.groups.repo,
  };
};

export class GithubInit {
  githubLogin: GithubLogin;

  scms: Scms;

  show: Show;

  constructor() {
    this.githubLogin = new GithubLogin();
    this.scms = new Scms();
    this.show = new Show();
  }

  async handle(repoUrl: string): Promise<boolean> {
    const { org, repo } = isGithubRepo(repoUrl);
    if (!org || !repo) {
      log.debug('Not a github repo', repoUrl);
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
    } catch (e) {
      if (e instanceof NotFoundError) {
        await this.createConfig(org, repo);
      }
    }

    await this.registerRepo(org, repo);

    ui.updateBottomBar(`Fetching and checking config...`);
    await this.show.fetchConfig(org);
    ui.updateBottomBar(`Fetching metadata...`);
    await this.show.fetchMetadataXml(org);

    ui.updateBottomBar('');
    inquirer.restoreDefaultPrompts();
    console.log(`Configuration is valid!`);

    return true;
  }

  private async assertRepo(org: string, repo: string): Promise<void> {
    log.debug('Checking for access to', org, repo);
    ui.updateBottomBar(`Checking access to ${org}/${repo}...`);

    const { github } = await this.scms.loadClients();
    if (!github) {
      throw new Error(NOT_LOGGED_IN);
    }

    const { data: user, headers } = await github.users.getAuthenticated();

    try {
      this.assertScopes(headers, 'repo');
    } catch (e) {
      if (e instanceof Error) {
        log.debug(e.message);
        console.log(GITHUB_ACCESS_NEEDED(org));
        await this.githubLogin.handle('repo');
        return this.assertRepo(org, repo);
      }
      throw e;
    }

    if (user.login.toLowerCase() !== org.toLowerCase()) {
      ui.updateBottomBar(`Checking membership on ${org}/${repo}...`);
      try {
        await github.orgs.checkMembershipForUser({ org, username: user.login });
      } catch (e) {
        if (e instanceof Error) {
          log.debug(e.message);
          console.log(GITHUB_ACCESS_NEEDED(org));
          await this.githubLogin.handle('repo');
          return this.assertRepo(org, repo);
        }
      }
    }

    ui.updateBottomBar(`Checking access to ${org}/${repo}...`);
    try {
      await github.repos.get({ owner: org, repo });
    } catch (e) {
      if (e instanceof Error) {
        log.debug(e.message);
        throw new Error(REPO_DOES_NOT_EXIST(org, repo));
      }
    }
  }

  private assertScopes(
    headers: { [header: string]: string | number | undefined },
    expectedScope: string,
  ): void {
    const xOauthScopes = headers['x-oauth-scopes'] as string;
    log.debug('Current scopes:', xOauthScopes);
    const scopes = xOauthScopes.split(' ');
    if (scopes.includes(expectedScope)) {
      return;
    }

    throw new Error(`Missing scope. Expected:${expectedScope} Actual:${scopes}`);
  }

  private async assertConfig(org: string, repo: string, file = CONFIG_FILE): Promise<void> {
    log.debug('Checking for config file', org, repo, file);

    const { github } = await this.scms.loadClients();
    if (!github) {
      throw new Error(NOT_LOGGED_IN);
    }

    ui.updateBottomBar(`Fetching ${file} on ${org}/${repo}...`);
    try {
      await github.repos.getContent({ owner: org, repo, path: file });
      ui.updateBottomBar(`Found ${file} in ${org}/${repo}!`);
    } catch (e) {
      if (e instanceof RequestError && e.status === 404) {
        ui.updateBottomBar(`${file} was not found in ${org}/${repo}!`);
        throw new NotFoundError();
      }
      throw e;
    }
  }

  private async listExamples(): Promise<ExampleConfig[]> {
    log.debug('Fetching examples');
    ui.updateBottomBar('Fetching sample configurations...');
    const octokit = new Octokit();

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
    }, [] as ExampleConfig[]);
  }

  public async createConfig(org: string, repo: string, file = CONFIG_FILE): Promise<void> {
    ui.updateBottomBar('');
    const { createFile } = await inquirer.prompt({
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

    ui.updateBottomBar('');
    const { url } = await inquirer.prompt({
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

    const { data: configYaml } = await axios.get(url);

    const config = load(configYaml) as GithubSlsRestApiConfigV20211212;
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

      const answers = await inquirer.prompt(
        prompts.map(([key]) => {
          return { type: 'string', name: key };
        }),
      );

      config.variables = Object.entries(answers).reduce((acc, [key, value]) => {
        acc[key] = `${value}`;
        return acc;
      }, {} as { [key: string]: GithubSlsRestApiVariableV1 });
    }

    const { github } = await this.scms.loadClients();
    if (!github) {
      throw new Error(NOT_LOGGED_IN);
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

    const newConfigYaml = `---\n${dump(config, { lineWidth: 1024 })}\n`;

    console.log("Here's your new configuration:\n\n");
    console.log(`${newConfigYaml}\n\n`);

    const commitResponse = await inquirer.prompt({
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
      fs.writeFileSync(outputPath, newConfigYaml);
      console.log(`Generated config file saved to \`${outputPath}\`.`);
      throw new Error(
        'Please run the `saml-to init` command again once the file has been placed in the repo.',
      );
    }

    await github.repos.createOrUpdateFileContents({
      owner: org,
      repo,
      path: file,
      message: '[saml-to cli] saml.to configuration file',
      content: Buffer.from(newConfigYaml, 'utf8').toString('base64'),
    });

    ui.updateBottomBar(`Committed ${file} to ${org}/${repo}!`);
  }

  private async registerRepo(org: string, repo: string): Promise<void> {
    ui.updateBottomBar(`Registering ${org}/${repo} with the backend...`);
    const accessToken = this.scms.getGithubToken();
    const idpApi = new IDPApi(
      new Configuration({
        accessToken: accessToken,
      }),
    );
    const { data: result } = await idpApi.setOrgAndRepo(org, repo);
    log.debug('Initialized repo', result);
  }
}
