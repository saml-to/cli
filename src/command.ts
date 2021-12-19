import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';
import axios from 'axios';
import { UNSUPPORTED_REPO_URL } from './messages';
import { Assume } from './commands/assume';
import { GithubInit } from './commands/github-init';
import { Show, ShowSubcommands } from './commands/show';
import inquirer from 'inquirer';
import { NoTokenError } from './stores/scms';
import { GithubLogin } from './commands/github-login';
import { Add, AddSubcommands } from './commands/add';

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

  private add: Add;

  constructor(private name: string) {
    this.assume = new Assume();
    this.githubInit = new GithubInit();
    this.show = new Show();
    this.add = new Add();
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
          ui.updateBottomBar('');
          console.log(`
Next, you will want to configure a service provider for saml.to.

The service provider will need your SAML Metadata or Certificicate, available with the following commands:
 - \`${this.name} show metadata\`
 - \`${this.name} show certificate\`

More information on Provider configuration can be found here: https://docs.saml.to/configuration/service-providers

Once a service provider is configured, you can then run:
\`${this.name} add provider\`
`);
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
        command: 'add [subcommand]',
        describe: 'Add providers or permissions to the configuration',
        handler: async ({ subcommand }) => {
          await loginWrapper('repo', () => this.add.handle(subcommand as AddSubcommands));
          if ((subcommand as AddSubcommands) === 'provider') {
            console.log(`
Next, you may add permissions by running:
\`${this.name} add permission\`

Additional providers can be added by running \`${this.name} add provider\` again.
            `);
          }
          if ((subcommand as AddSubcommands) === 'permission') {
            console.log(`
Finally, the users that were provided can login or assume roles:
 - \`${this.name} login\`
 - \`${this.name} assume\`

Or, you can direct them to visit: https://saml.to/sso

Additional permissions can be added by running \`${this.name} add permission\` again.
            `);
          }
        },
        builder: {
          subcommand: {
            demand: true,
            type: 'string',
            choices: ['provider', 'permission'] as string[],
          },
        },
      })
      .command({
        command: 'show [subcommand]',
        describe: 'Show organization configs',
        handler: async ({ org, subcommand, save, refresh, raw }) =>
          loginWrapper('user:email', () =>
            this.show.handle(
              subcommand as ShowSubcommands,
              org as string | undefined,
              save as boolean | undefined,
              refresh as boolean | undefined,
              raw as boolean | undefined,
            ),
          ),
        builder: {
          subcommand: {
            demand: true,
            type: 'string',
            choices: ['metadata', 'certificate', 'config', 'roles', 'logins', 'orgs'] as string[],
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
          raw: {
            demand: false,
            type: 'boolean',
            default: false,
            description: 'For `config` subcommand, show raw configuration',
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
