/* eslint-disable no-console */
// import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
// import log from 'loglevel';

import yargs from 'yargs';
import axios from 'axios';
import { UNSUPPORTED_REPO_URL } from './messages';
import { Assume } from './commands/assume';
import { GithubInit } from './commands/github-init';
import { Show, ShowSubcommands } from './commands/show';
import inquirer from 'inquirer';
import { NoTokenError } from './stores/scms';
import { GithubLogin } from './commands/github-login';
// import log from 'loglevel';

// log.setDefaultLevel('DEBUG');

process.on('SIGINT', () => {
  process.exit(0);
});

const loginWrapper = async (scope: string, fn: () => Promise<void>): Promise<void> => {
  try {
    await fn();
  } catch (e) {
    if (e instanceof NoTokenError) {
      const githubLogin = new GithubLogin();
      await githubLogin.handle(scope);
      await fn();
    } else {
      throw e;
    }
  }
};

export const ui = new inquirer.ui.BottomBar();

export class Command {
  private assume: Assume;

  private githubInit: GithubInit;

  private show: Show;

  constructor(private name: string) {
    this.assume = new Assume();
    this.githubInit = new GithubInit();
    this.show = new Show();
  }

  public async run(argv: string[]): Promise<void> {
    const ya = yargs
      .scriptName(this.name)
      .command({
        command: 'init [scm]',
        describe: 'Set a repository for the saml.to configuration',
        handler: async ({ scm, repoUrl, force }) => {
          const handled = await this.githubInit.handle(
            scm as string,
            repoUrl as string,
            force as boolean | undefined,
          );
          if (!handled) {
            throw new Error(UNSUPPORTED_REPO_URL);
          }
        },
        builder: {
          scm: {
            demand: true,
            choices: ['github'] as const,
            default: 'github',
          },
          repoUrl: {
            demand: false,
            type: 'string',
          },
          force: {
            demand: false,
            type: 'boolean',
            default: false,
          },
        },
      })
      .command({
        command: 'show [subcommand]',
        describe: 'Show organization configs',
        handler: async ({ org, subcommand, save, refresh }) =>
          loginWrapper('user:email', () =>
            this.show.handle(
              subcommand as ShowSubcommands,
              org as string | undefined,
              save as boolean | undefined,
              refresh as boolean | undefined,
            ),
          ),
        builder: {
          subcommand: {
            demand: true,
            type: 'string',
            choices: ['metadata', 'certificate', 'roles', 'logins', 'orgs'] as string[],
          },
          org: {
            demand: false,
            type: 'string',
            description: 'Specify an organization',
          },
          save: {
            demand: false,
            type: 'boolean',
            default: false,
            description: 'Output to a file',
          },
          refresh: {
            demand: false,
            type: 'boolean',
            default: false,
            description: 'Refresh backend config',
          },
        },
      })
      .command({
        command: 'assume [role]',
        describe: 'Assume a role. Use the `show roles` command to show available roles',
        handler: ({ role, org, provider, headless }) =>
          loginWrapper('user:email', () =>
            this.assume.handle(
              role as string,
              headless as boolean,
              org as string | undefined,
              provider as string | undefined,
            ),
          ),
        builder: {
          role: {
            demand: false,
            type: 'string',
            description: 'The role to assume',
          },
          org: {
            demand: false,
            type: 'string',
            description: 'Specify an organization',
          },
          headless: {
            demand: false,
            type: 'boolean',
            default: false,
            description: 'Output access credentials to the terminal',
          },
          provider: {
            demand: false,
            type: 'string',
            description: 'Specify the provider',
          },
        },
      })
      .help()
      .showHelpOnFail(true)
      .strict()
      .wrap(null)
      .fail((msg, error) => {
        if (axios.isAxiosError(error)) {
          if (error.response && error.response.status === 401) {
            ui.updateBottomBar('');
            console.error('Unauthorized');
          } else {
            ui.updateBottomBar('');
            console.error(
              `API Error: ${
                (error.response && error.response.data && error.response.data.message) ||
                error.message
              }`,
            );
          }
        } else {
          ui.updateBottomBar('');
          console.error(`Error: ${error ? error.message : msg}`);
        }
        process.exit(-1);
      });

    const parsed = await ya.parse(hideBin(argv));

    if (parsed._.length === 0) {
      ya.showHelp();
    }

    process.exit(0);
  }
}
