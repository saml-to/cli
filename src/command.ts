import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';
import axios from 'axios';
import { Assume } from './commands/assume';
import { Init } from './commands/init';
import { Show, ShowSubcommands } from './commands/show';
import inquirer from 'inquirer';
import { NoTokenError } from './stores/scms';
import { GithubHelper } from './helpers/githubHelper';
import { Add, AddAttributes, AddNameIdFormats } from './commands/add';
import { Login } from './commands/login';

const loginWrapper = async (scope: string, fn: () => Promise<void>): Promise<void> => {
  try {
    await fn();
  } catch (e) {
    if (e instanceof NoTokenError) {
      const githubLogin = new GithubHelper();
      await githubLogin.promptLogin(scope);
      await fn();
    } else {
      throw e;
    }
  }
};

export const ui = new inquirer.ui.BottomBar();

export class Command {
  private assume: Assume;

  private login: Login;

  private init: Init;

  private show: Show;

  private add: Add;

  constructor(private name: string) {
    this.assume = new Assume();
    this.login = new Login();
    this.init = new Init();
    this.show = new Show();
    this.add = new Add();
  }

  public async run(argv: string[]): Promise<void> {
    const ya = yargs
      .scriptName(this.name)
      .command({
        command: 'init',
        describe: 'Initialize SAML.to with a GitHub Repository',
        handler: async ({ force }) => {
          await this.init.handle(force as boolean | undefined);
          ui.updateBottomBar('');
          console.log(`
Next, you can to configure a Service Provider for SAML.to.

The service provider will need your SAML Metadata or Certificicate, available with the following commands:
 - \`${this.name} show metadata\`
 - \`${this.name} show certificate\`

More information on Provider configuration can be found here: https://docs.saml.to/configuration/service-providers

Once a service provider is configured, you can then run:
\`${this.name} add provider\`
`);
        },
        builder: {
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
        command: 'add provider [name]',
        describe: 'Add a provider to the configuration',
        handler: async ({ name, entityId, acsUrl, loginUrl, nameId, nameIdFormat, attribute }) => {
          await loginWrapper('repo', () =>
            this.add.handle(
              'provider',
              name as string | undefined,
              entityId as string | undefined,
              acsUrl as string | undefined,
              loginUrl as string | undefined,
              nameId as string | undefined,
              (nameIdFormat as AddNameIdFormats) || 'NONE',
              attribute as AddAttributes | undefined,
            ),
          );
        },
        builder: {
          name: {
            demand: false,
            type: 'string',
          },
          entityId: {
            demand: false,
            type: 'string',
          },
          acsUrl: {
            demand: false,
            type: 'string',
          },
          loginUrl: {
            demand: false,
            type: 'string',
          },
          nameId: {
            demand: false,
            type: 'string',
          },
          nameIdFormat: {
            demand: false,
            type: 'string',
            choices: ['id', 'login', 'email', 'emailV2', 'none'] as AddNameIdFormats[],
          },
          attribute: {
            demand: false,
            type: 'array',
            description: 'Additional addtributes in key=value pairs',
            coerce: (values) => {
              if (!values || !Array.isArray(values)) {
                return;
              }
              return values.reduce((acc, value) => {
                try {
                  const parsed = JSON.parse(
                    (
                      '{"' +
                      value
                        .replace(/^\s+|\s+$/g, '')
                        .replace(/=(?=\s|$)/g, '="" ')
                        .replace(/\s+(?=([^"]*"[^"]*")*[^"]*$)/g, '", "')
                        .replace(/=/g, '": "') +
                      '"}'
                    ).replace(/""/g, '"'),
                  );
                  return {
                    ...acc,
                    ...parsed,
                  };
                } catch (e) {
                  if (e instanceof Error) {
                    throw new Error(`Error parsing ${value}: ${e.message}`);
                  }
                }
              }, {} as AddAttributes);
            },
          },
        },
      })
      .command({
        command: 'show [subcommand]',
        describe: `Show various configurations (metadata, certificate, entityId, config, etc.) Use \`${this.name} show --help\` for the available subcommands.`,
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
            choices: [
              'metadata',
              'certificate',
              'entityId',
              'loginUrl',
              'logoutUrl',
              'config',
              'roles',
              'logins',
              'orgs',
            ] as ShowSubcommands[],
          },
          org: {
            demand: false,
            type: 'string',
            description: 'Specify an organization',
          },
          save: {
            demand: false,
            type: 'boolean',
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
        describe: 'Assume a role',
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
      .command({
        command: 'login [provider]',
        describe: 'Login to a provider',
        handler: ({ org, provider }) =>
          loginWrapper('user:email', () =>
            this.login.handle(provider as string, org as string | undefined),
          ),
        builder: {
          provider: {
            demand: true,
            type: 'string',
            description: 'The provider for which to login',
          },
          org: {
            demand: false,
            type: 'string',
            description: 'Specify an organization',
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
