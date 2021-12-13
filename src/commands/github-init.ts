// import { RequestError } from '@octokit/request-error';
import { RequestError } from '@octokit/request-error';
import log from 'loglevel';
import { GITHUB_ACCESS_NEEDED, NOT_LOGGED_IN, REPO_DOES_NOT_EXIST } from '../messages';
import { GithubLogin } from './github-login';
import prompts from 'prompts';

const REPO_REGEX = /^.*github\.com[:/]+(?<org>.*)\/(?<repo>.*?)(.git)*$/gm;

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

  constructor() {
    this.githubLogin = new GithubLogin();
  }

  async handle(repoUrl: string): Promise<boolean> {
    const { org, repo } = isGithubRepo(repoUrl);
    if (!org || !repo) {
      log.debug('Not a github repo', repoUrl);
      return false;
    }

    await this.assertRepo(org, repo);
    await this.assertConfig(org, repo);

    return true;
    // Check if config file exists
    // Validate config
  }

  private async assertRepo(org: string, repo: string): Promise<void> {
    log.debug('Checking for access to', org, repo);

    const { github } = await this.githubLogin.scms.loadClients();
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

  private async assertConfig(org: string, repo: string, file = 'saml-to.yml'): Promise<void> {
    log.debug('Checking for config file', org, repo, file);

    const { github } = await this.githubLogin.scms.loadClients();
    if (!github) {
      throw new Error(NOT_LOGGED_IN);
    }

    try {
      await github.repos.getContent({ owner: org, repo, path: file });
      console.log(`Found an existing config file: ${file} in ${org}/${repo}`);
    } catch (e) {
      if (e instanceof RequestError && e.status === 404) {
        console.log(`It appears that ${file} does not exist in ${org}/${repo}`);
        const response = await prompts({
          type: 'confirm',
          name: 'createFile',
          message: 'Would you like me to setup a configuration file for you?',
        });
        if (!response.createFile) {
          throw new Error(`Config file ${file} does not exist in ${org}/${repo}`);
        }
        await this.createConfig(org, repo, file);
        return;
      }
      throw e;
    }

    const content = await github.repos.getContent({ owner: org, repo, path: file });
    console.log('!!! content', content);
  }

  private async listExamples(): Promise<void> {
    const { github } = await this.githubLogin.scms.loadClients();
    if (!github) {
      throw new Error(NOT_LOGGED_IN);
    }

    console.log('!!! getting config from saml-to');

    const content = await github.repos.getContent({
      owner: 'saml-to',
      repo: 'cli',
      path: 'examples',
    });
    console.log('!!! content', content);
  }

  private async createConfig(org: string, repo: string, file: string): Promise<void> {
    log.debug('Creating config', org, repo, file);
    await this.listExamples();
  }
}
