// import { RequestError } from '@octokit/request-error';
// import { RequestError } from '@octokit/request-error';
import log from 'loglevel';
import { GITHUB_ACCESS_NEEDED, NO_GITHUB_CLIENT, REPO_DOES_NOT_EXIST } from '../messages';
import { GithubLogin } from './github-login';
import inquirer from 'inquirer';
import {
  IDPApi,
  Configuration,
  GithubSlsRestApiConfigV20211212,
  GithubSlsRestApiConfigV20211212VersionEnum,
} from '../../api/github-sls-rest-api';
import { Scms } from '../stores/scms';
import { Show } from './show';
import { ui } from '../command';
import { RequestError } from '@octokit/request-error';
import { dump } from 'js-yaml';

export const CONFIG_FILE = 'saml-to.yml';
const REPO_REGEX = /^.*github\.com[:/]+(?<org>.*)\/(?<repo>.*?)(.git)*$/gm;

const EMPTY_CONFIG: GithubSlsRestApiConfigV20211212 = {
  version: GithubSlsRestApiConfigV20211212VersionEnum._20211212,
  variables: {},
  providers: {},
  permissions: {},
};

// type ExampleConfig = {
//   name: string;
//   downloadUrl: string;
//   viewUrl?: string;
// };

// class NotFoundError extends Error {}

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

  async handle(scm: string, repoUrl?: string, force = false): Promise<boolean> {
    if (scm !== 'github') {
      return false;
    }

    if (!repoUrl) {
      const { repoInput } = await inquirer.prompt({
        type: 'input',
        name: 'repoInput',
        message: `What is the full URL of the repository that will store the \`${CONFIG_FILE}\` configuration file?
(e.g. https://github.com/MyOrg/saml-to)
`,
      });

      repoUrl = repoInput as string;
    }

    const { org, repo } = isGithubRepo(repoUrl);
    if (!org || !repo) {
      log.debug('Not a github repo', repoUrl);
      return false;
    }

    ui.updateBottomBar(`Checking access to ${org}/${repo}...`);
    await this.assertRepo(org, repo, 'repo');
    ui.updateBottomBar(`Registering ${org}/${repo}...`);
    await this.registerRepo(org, repo, force);
    ui.updateBottomBar(`Fetching metadata...`);
    await this.show.fetchMetadataXml(org);

    this.scms.saveGithubOrg(org);

    ui.updateBottomBar('');
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

  public async assertRepo(org: string, repo: string, scope: string): Promise<void> {
    await this.githubLogin.assertScope(scope);

    const { github } = await this.scms.loadClients();
    if (!github) {
      throw new Error(NO_GITHUB_CLIENT);
    }

    const { data: user } = await github.users.getAuthenticated();

    if (user.login.toLowerCase() !== org.toLowerCase()) {
      ui.updateBottomBar(`Checking membership on ${org}/${repo}...`);
      try {
        await github.orgs.checkMembershipForUser({ org, username: user.login });
      } catch (e) {
        if (e instanceof Error) {
          ui.updateBottomBar('');
          console.log(GITHUB_ACCESS_NEEDED(org, scope));
          await this.githubLogin.handle('repo');
          return this.assertRepo(org, repo, scope);
        }
      }
    }

    ui.updateBottomBar(`Checking access to ${org}/${repo}...`);
    try {
      const { data: repository } = await github.repos.get({ owner: org, repo });
      if (repository.visibility === 'public') {
        ui.updateBottomBar('');
        const { makePrivate } = await inquirer.prompt({
          type: 'confirm',
          name: 'makePrivate',
          message: `It's recommended to keep ${org}/${repo} as a private repository, would you like to convert it to a private repository?`,
        });
        if (makePrivate) {
          await github.repos.update({ owner: org, repo, visibility: 'private' });
        } else {
          console.warn(`WARN: ${org}/${repo} is publicly visible, but it does not need to be!`);
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        ui.updateBottomBar('');
        const { createRepo } = await inquirer.prompt({
          type: 'confirm',
          name: 'createRepo',
          message: `It appears that \`${org}/${repo}\` does not exist yet, do you want to create it?`,
        });

        if (!createRepo) {
          throw new Error(REPO_DOES_NOT_EXIST(org, repo));
        }

        ui.updateBottomBar(`Creating repository ${org}/${repo}...`);
        if (user.login.toLowerCase() !== org.toLowerCase()) {
          await github.repos.createInOrg({ name: repo, org, visibility: 'private' });
        } else {
          await github.repos.createForAuthenticatedUser({ name: repo, visibility: 'private' });
        }
        return this.assertRepo(org, repo, scope);
      }
    }

    ui.updateBottomBar(`Checking for existing config...`);
    try {
      await github.repos.getContent({ owner: org, repo, path: CONFIG_FILE });
    } catch (e) {
      if (e instanceof RequestError && e.status === 404) {
        ui.updateBottomBar('');
        const { createConfig } = await inquirer.prompt({
          type: 'confirm',
          name: 'createConfig',
          message: `It appears that \`${org}/${repo}\` does not contain \`${CONFIG_FILE}\` yet. Would you like to create an empty config file?`,
        });
        if (!createConfig) {
          console.warn(`Skipping creation of \`${CONFIG_FILE}\`, please be sure to create it!`);
          return;
        }

        await github.repos.createOrUpdateFileContents({
          owner: org,
          repo,
          content: Buffer.from(
            `---
${dump(EMPTY_CONFIG)}
`,
            'utf8',
          ).toString('base64'),
          message: `initial saml.to configuration`,
          path: CONFIG_FILE,
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

  private async registerRepo(org: string, repo: string, force?: boolean): Promise<void> {
    const accessToken = this.scms.getGithubToken();
    const idpApi = new IDPApi(
      new Configuration({
        accessToken: accessToken,
      }),
    );
    const { data: result } = await idpApi.setOrgAndRepo(org, repo, force);
    log.debug('Initialized repo', result);
  }
}
