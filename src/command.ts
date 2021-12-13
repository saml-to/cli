/* eslint-disable no-console */
// import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
// import log from 'loglevel';

import yargs from 'yargs';
import { ListRoles } from './commands/list-roles';
import axios from 'axios';
import { GithubLogin } from './commands/github-login';
import { NOT_LOGGED_IN, UNSUPPORTED_REPO_URL } from './messages';
import { Assume } from './commands/assume';
import { GithubInit } from './commands/github-init';
import { Show, ShowSubcommands } from './commands/show';
import inquirer from 'inquirer';
// import log from 'loglevel';

// log.setDefaultLevel('DEBUG');

export const ui = new inquirer.ui.BottomBar();

export class Command {
  private listRoles: ListRoles;

  private githubLogin: GithubLogin;

  private assume: Assume;

  private githubInit: GithubInit;

  private show: Show;

  constructor(private name: string) {
    this.githubLogin = new GithubLogin();
    this.listRoles = new ListRoles();
    this.assume = new Assume();
    this.githubInit = new GithubInit();
    this.show = new Show();
  }

  public async run(argv: string[]): Promise<void> {
    const ya = yargs
      .scriptName(this.name)
      .command({
        command: 'login [scm]',
        describe: 'Generate and locally store a token from the SCM (e.g. GitHub)',
        handler: ({ scm }) => {
          if (scm === 'github') {
            return this.githubLogin.handle();
          } else {
            throw new Error(`Unknown scm provider: ${scm}`);
          }
        },
        builder: {
          scm: {
            demand: true,
            choices: ['github'] as const,
            default: 'github',
          },
        },
      })
      .command({
        command: 'init [repoUrl]',
        describe: 'Initialize a repository to use with saml.to',
        handler: async ({ repoUrl }) => {
          const handled = await this.githubInit.handle(repoUrl as string);
          if (!handled) {
            throw new Error(UNSUPPORTED_REPO_URL);
          }
        },
        builder: {
          repoUrl: {
            demand: true,
            type: 'string',
          },
        },
      })
      .command({
        command: 'show [org] [subcommand]',
        describe: 'Show organization configs',
        handler: async ({ org, subcommand }) => {
          await this.show.handle(subcommand as ShowSubcommands, org as string);
        },
        builder: {
          org: {
            demand: true,
            type: 'string',
          },
          subcommand: {
            demand: true,
            type: 'string',
            choices: ['config', 'metadata', 'certificate'] as string[],
            default: 'config',
          },
        },
      })
      .command({
        command: 'list-roles',
        describe: 'List available roles for assumption',
        handler: () => this.listRoles.handle(),
      })
      .command({
        command: 'assume [role]',
        describe: 'Assume a role. Use the `list-roles` command to see available role',
        handler: ({ role, org, repo, provider, headless }) =>
          this.assume.handle(
            role as string,
            headless as boolean,
            org as string | undefined,
            repo as string | undefined,
            provider as string | undefined,
          ),
        builder: {
          role: {
            demand: true,
            type: 'string',
          },
          headless: {
            demand: false,
            type: 'boolean',
            default: false,
            description: 'Output access credentials to the terminal',
          },
          org: {
            demand: false,
            type: 'string',
            description: 'Specify the organization with SAML.to configuration',
          },
          provider: {
            demand: false,
            type: 'string',
            description: 'Specify a specific provider',
          },
        },
      })
      .option('debug', { default: false })
      .help()
      .showHelpOnFail(true)
      .strict()
      .wrap(null)
      .fail((msg, error) => {
        if (axios.isAxiosError(error)) {
          if (error.response && error.response.status === 401) {
            ui.updateBottomBar('');
            console.error(NOT_LOGGED_IN);
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
