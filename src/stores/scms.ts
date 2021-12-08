import { Octokit } from '@octokit/rest';
import os from 'os';
import path from 'path';
import fs from 'fs';
// import { env } from 'process';
import { ERROR_LOADING_FILE } from '../messages';

type GithubFile = {
  token: string;
};

export type ScmClients = {
  github?: Octokit;
};

export class Scms {
  configDir: string;

  githubFile: string;

  constructor() {
    this.configDir = `${path.join(os.homedir(), '.saml-to')}`;
    this.githubFile = path.join(this.configDir, 'github-token.json');

    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir);
    }
  }

  async loadClients(): Promise<ScmClients> {
    const clients: ScmClients = {};
    clients.github = this.getOctokit();
    return clients;
  }

  public saveGithubToken(token: string): string {
    fs.writeFileSync(this.githubFile, JSON.stringify({ token } as GithubFile));
    return this.githubFile;
  }

  public getGithubToken(): string | undefined {
    // if (env.GITHUB_TOKEN) {
    //   return env.GITHUB_TOKEN;
    // }

    if (!fs.existsSync(this.githubFile)) {
      return;
    }

    try {
      const { token } = JSON.parse(fs.readFileSync(this.githubFile).toString()) as GithubFile;
      return token;
    } catch (e) {
      if (e instanceof Error) {
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
}
