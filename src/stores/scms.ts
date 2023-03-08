import { Octokit } from '@octokit/rest';
import os from 'os';
import path from 'path';
import fs from 'fs';
// import { env } from 'process';
import { ERROR_LOADING_FILE } from '../messages';
import { ui } from '../command';

export const CONFIG_DIR = `${path.join(os.homedir(), '.saml-to')}`;

export type Scm = 'github';

type GithubFile = {
  token: string;
};

type OrgFile = {
  name: string;
  scm: Scm;
};

export type ScmClients = {
  github?: Octokit;
};

export class NoTokenError extends Error {
  constructor() {
    super('No token!');
  }
}

export class Scms {
  githubFile: string;

  orgFile: string;

  constructor(configDir = CONFIG_DIR) {
    this.githubFile = path.join(configDir, 'github-token.json');
    this.orgFile = path.join(configDir, 'org.json');

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir);
    }
  }

  async loadClients(): Promise<ScmClients> {
    const clients: ScmClients = {};
    clients.github = this.getOctokit();
    return clients;
  }

  public saveGithubOrg(org: string): string {
    fs.writeFileSync(this.orgFile, JSON.stringify({ name: org, scm: 'github' } as OrgFile));
    ui.updateBottomBar('');
    console.log(`Default organization cached in: ${this.orgFile}`);
    return this.orgFile;
  }

  public saveGithubToken(token: string): string {
    fs.writeFileSync(this.githubFile, JSON.stringify({ token } as GithubFile), { mode: 0o600 });
    ui.updateBottomBar('');
    console.log(`Token cached in: ${this.githubFile}`);
    return this.githubFile;
  }

  public getGithubToken(passive = false): string | undefined {
    // if (env.GITHUB_TOKEN) {
    //   return env.GITHUB_TOKEN;
    // }

    const githubFileExists = fs.existsSync(this.githubFile);
    if (passive && !githubFileExists) {
      return;
    }

    if (!githubFileExists) {
      throw new NoTokenError();
    }

    try {
      const { token } = JSON.parse(fs.readFileSync(this.githubFile).toString()) as GithubFile;
      return token;
    } catch (e) {
      if (e instanceof Error) {
        ui.updateBottomBar('');
        console.warn(ERROR_LOADING_FILE(this.githubFile, e));
        return;
      }
      throw e;
    }
  }

  public getOrg(): string | undefined {
    if (!fs.existsSync(this.orgFile)) {
      return;
    }

    try {
      const { name } = JSON.parse(fs.readFileSync(this.orgFile).toString()) as OrgFile;
      return name;
    } catch (e) {
      if (e instanceof Error) {
        ui.updateBottomBar('');
        console.warn(ERROR_LOADING_FILE(this.githubFile, e));
        return;
      }
      throw e;
    }
  }

  private getOctokit(): Octokit | undefined {
    const token = this.getGithubToken();
    if (!token) {
      return;
    }
    return new Octokit({ auth: token });
  }

  public async getLogin(): Promise<string> {
    const token = this.getGithubToken();
    if (!token) {
      throw new Error('Unable to get token');
    }

    const octokit = new Octokit({ auth: token });

    ui.updateBottomBar('Fetching GitHub identity...');
    const { data: user } = await octokit.users.getAuthenticated();

    return user.login;
  }
}
