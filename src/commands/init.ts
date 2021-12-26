// import { RequestError } from '@octokit/request-error';
// import { RequestError } from '@octokit/request-error';
import log from 'loglevel';
import { GITHUB_ACCESS_NEEDED, REPO_DOES_NOT_EXIST } from '../messages';
import { GithubHelper } from '../helpers/githubHelper';
import inquirer from 'inquirer';
import {
  IDPApi,
  Configuration,
  GithubSlsRestApiConfigV20220101,
  GithubSlsRestApiConfigV20220101VersionEnum,
} from '../../api/github-sls-rest-api';
import { Scms } from '../stores/scms';
import { Show } from './show';
import { ui } from '../command';
import { RequestError } from '@octokit/request-error';
import { dump } from 'js-yaml';
import { Octokit } from '@octokit/rest';

export const CONFIG_FILE = 'saml-to.yml';

const EMPTY_CONFIG: GithubSlsRestApiConfigV20220101 = {
  version: GithubSlsRestApiConfigV20220101VersionEnum._20220101,
  providers: {},
  permissions: {},
};

export class Init {
  githubHelper: GithubHelper;

  scms: Scms;

  show: Show;

  constructor() {
    this.githubHelper = new GithubHelper();
    this.scms = new Scms();
    this.show = new Show();
  }

  async handle(force = false): Promise<void> {
    ui.updateBottomBar('');
    console.log(`Welcome to SAML.to!

SAML.to enables administrators to grant access to Service Providers to GitHub users.

This utility will assist you in connecting a new or existing repository of your choice for configuration.

SAML.to is configured by adding a \`${CONFIG_FILE}\` to any GitHub organization and repository which defines providers and access privleges.

Once configured, you (or users in your organzation) will be able to login to services (and assume roles, if supported) using this utility or from the web.

For more information, check out https://docs.saml.to
`);

    ui.updateBottomBar('');
    const { org } = await inquirer.prompt({
      type: 'input',
      name: 'org',
      message: `Which GitHub User or Organiztion would you like to use?
`,
    });

    ui.updateBottomBar(`Checking if ${org} exists...`);
    await this.assertOrg(org);

    ui.updateBottomBar('');
    const { repo } = await inquirer.prompt({
      type: 'input',
      name: 'repo',
      default: 'saml-to',
      message: `Which Repository within ${org} would you like to use to store the \`${CONFIG_FILE}\` configuration file?
(If it doesn't yet exist, we'll give you an option to create it!)
`,
    });
    ui.updateBottomBar(`Checking access to ${org}/${repo}...`);
    await this.assertRepo(org, repo, 'repo');
    ui.updateBottomBar(`Registering ${org}/${repo}...`);
    await this.registerRepo(org, repo, force);
    ui.updateBottomBar(`Fetching metadata...`);
    await this.show.fetchMetadataXml(org);

    this.scms.saveGithubOrg(org);

    ui.updateBottomBar('');
    console.log(`Repository \`${org}/${repo}\` registered!`);
  }

  private async assertOrg(org: string): Promise<'User' | 'Organization'> {
    const octokit = new Octokit();

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
      if (e instanceof RequestError && e.status === 404) {
        throw new Error(`Unable to find user or organization: ${org}`);
      }
      throw e;
    }
  }

  private async assertRepo(org: string, repo: string, scope: string): Promise<void> {
    await this.githubHelper.assertScope(scope, org);

    const { github } = await this.scms.loadClients();
    if (!github) {
      await this.githubHelper.promptLogin(scope);
      return this.assertRepo(org, repo, scope);
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
          await this.githubHelper.promptLogin('repo', org);
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
