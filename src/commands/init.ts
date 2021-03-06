// import { RequestError } from '@octokit/request-error';
// import { RequestError } from '@octokit/request-error';
import log from 'loglevel';
import { GITHUB_ACCESS_NEEDED, REPO_DOES_NOT_EXIST } from '../messages';
import { GithubHelper } from '../helpers/githubHelper';
import {
  GithubSlsRestApiConfigV20220101,
  GithubSlsRestApiSupportedVersions,
} from '../../api/github-sls-rest-api';
import { Scms } from '../stores/scms';
import { ShowCommand } from './show';
import { prompt, ui } from '../command';
import { RequestError } from '@octokit/request-error';
import { dump } from 'js-yaml';
import { Octokit } from '@octokit/rest';
import { MessagesHelper } from '../helpers/messagesHelper';
import { event } from '../helpers/events';
import { ApiHelper } from '../helpers/apiHelper';

export const CONFIG_FILE = 'saml-to.yml';

const EMPTY_CONFIG: GithubSlsRestApiConfigV20220101 = {
  version: GithubSlsRestApiSupportedVersions._20220101,
  providers: {},
  permissions: {},
};

export class InitCommand {
  githubHelper: GithubHelper;

  scms: Scms;

  show: ShowCommand;

  constructor(private apiHelper: ApiHelper, private messagesHelper: MessagesHelper) {
    this.githubHelper = new GithubHelper(apiHelper, messagesHelper);
    this.scms = new Scms();
    this.show = new ShowCommand(apiHelper);
  }

  async handle(force = false): Promise<void> {
    event(this.scms, 'init');

    this.messagesHelper.introduction(CONFIG_FILE);

    ui.updateBottomBar('');
    const { org } = await prompt('org', {
      type: 'input',
      name: 'org',
      message: `Which GitHub User or Organization would you like to use?
`,
    });

    ui.updateBottomBar(`Checking if ${org} exists...`);
    await this.assertOrg(org);

    event(this.scms, 'init', undefined, org);
    ui.updateBottomBar('');
    const { createMode } = await prompt('createMode', {
      type: 'list',
      name: 'createMode',
      message: `Would you like to create a new repository for the \`${CONFIG_FILE}\` configuration file or use an existing repostiory?`,
      choices: [
        { name: 'Create a new repository', value: 'create' },
        { name: 'Use an existing repository', value: 'existing' },
      ],
    });

    let repo: string;
    if (createMode === 'create') {
      ui.updateBottomBar('');
      repo = (
        await prompt('repo', {
          type: 'input',
          name: 'repo',
          default: 'saml-to',
          message: `What would you like the new repository named?`,
        })
      ).repo;
    } else {
      ui.updateBottomBar('');
      repo = (
        await prompt('repo', {
          type: 'input',
          name: 'repo',
          default: 'saml-to',
          message: `What pre-existing repository would you like to yuse to store the \`${CONFIG_FILE}\` configuration file?`,
        })
      ).repo;
    }

    ui.updateBottomBar(`Checking access to ${org}/${repo}...`);
    await this.assertRepo(org, repo, 'repo');
    ui.updateBottomBar(`Registering ${org}/${repo}...`);
    await this.registerRepo(org, repo, force);
    ui.updateBottomBar(`Fetching metadata...`);
    await this.show.fetchMetadataXml(org);

    this.scms.saveGithubOrg(org);

    ui.updateBottomBar('');
    console.log(`Repository \`${org}/${repo}\` registered!`);

    this.messagesHelper.postInit(
      org,
      repo,
      `https://github.com/${org}/${repo}/blob/main/${CONFIG_FILE}`,
    );
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
        const { makePrivate } = await prompt('makePrivate', {
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
        const { createRepo } = await prompt('createRepo', {
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
        const { createConfig } = await prompt('createConfig', {
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
    const idpApi = this.apiHelper.idpApi(accessToken);
    const { data: result } = await idpApi.setOrgAndRepo(org, repo, force);
    log.debug('Initialized repo', result);
  }
}
