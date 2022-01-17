import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';
import axios from 'axios';
import { Assume } from './commands/assume';
import { Init } from './commands/init';
import { Show, ShowSubcommands } from './commands/show';
import { ProvisioningTypes, Set, SetHandleOpts, SetSubcommands } from './commands/set';
import inquirer, { QuestionCollection } from 'inquirer';
import { NoTokenError } from './stores/scms';
import { GithubHelper } from './helpers/githubHelper';
import { Add, AddAttributes, AddNameIdFormats, AddSubcommands } from './commands/add';
import { Login } from './commands/login';
import { MessagesHelper } from './helpers/messagesHelper';
import PromptUI from 'inquirer/lib/ui/prompt';
import packageJson from '../package.json';
import open from 'open';

const { version } = packageJson;

const loginWrapper = async (
  messagesHelper: MessagesHelper,
  scope: string,
  fn: () => Promise<void>,
): Promise<void> => {
  try {
    await fn();
  } catch (e) {
    if (e instanceof NoTokenError) {
      const githubLogin = new GithubHelper(messagesHelper);
      await githubLogin.promptLogin(scope);
      await fn();
    } else {
      throw e;
    }
  }
};

export const ui = new inquirer.ui.BottomBar({ output: process.stderr });

process.addListener('SIGINT', () => {
  console.log('Exiting!');
  process.exit(-1);
});

export const prompt = <T>(
  field: string,
  questions: QuestionCollection<T>,
  initialAnswers?: Partial<T>,
): Promise<T> & { ui: PromptUI } => {
  if (!process.stdin.isTTY) {
    throw new Error(`TTY is disabled. Please provide \`${field}\` as a command line argument`);
  }
  return inquirer.prompt(questions, initialAnswers);
};

export class Command {
  private messagesHelper: MessagesHelper;

  private assume: Assume;

  private login: Login;

  private init: Init;

  private show: Show;

  private add: Add;

  private set: Set;

  constructor(argv: string[]) {
    this.messagesHelper = new MessagesHelper(argv);
    this.assume = new Assume(this.messagesHelper);
    this.login = new Login(this.messagesHelper);
    this.init = new Init(this.messagesHelper);
    this.show = new Show();
    this.add = new Add(this.messagesHelper);
    this.set = new Set();
  }

  public async run(argv: string[]): Promise<void> {
    const ya = yargs
      .scriptName(this.messagesHelper.processName)
      .command({
        command: 'list-logins',
        describe: `Show providers that are available to login`,
        handler: async ({ org, provider, refresh }) =>
          loginWrapper(this.messagesHelper, 'user:email', () =>
            this.show.handle(
              'logins' as ShowSubcommands,
              org as string | undefined,
              provider as string | undefined,
              false,
              refresh as boolean | undefined,
              false,
            ),
          ),
        builder: {
          org: {
            demand: false,
            type: 'string',
            description: 'Specify an organization',
          },
          provider: {
            demand: false,
            type: 'string',
            description: 'Specify an provider',
          },
          refresh: {
            demand: false,
            type: 'boolean',
            default: false,
            description: 'Refresh cached logins from source control',
          },
        },
      })
      .command({
        command: 'list-roles',
        describe: `Show roles that are available to assume`,
        handler: async ({ org, provider, refresh }) =>
          loginWrapper(this.messagesHelper, 'user:email', () =>
            this.show.handle(
              'roles' as ShowSubcommands,
              org as string | undefined,
              provider as string | undefined,
              false,
              refresh as boolean | undefined,
              false,
            ),
          ),
        builder: {
          org: {
            demand: false,
            type: 'string',
            description: 'Specify an organization',
          },
          provider: {
            demand: false,
            type: 'string',
            description: 'Specify a provider',
          },
          refresh: {
            demand: false,
            type: 'boolean',
            default: false,
            description: 'Refresh cached logins from source control',
          },
        },
      })
      .command({
        command: 'login [provider]',
        describe: `Login to a provider`,
        handler: async ({ org, provider }) =>
          loginWrapper(this.messagesHelper, 'user:email', () =>
            this.login.handle(provider as string | undefined, org as string | undefined),
          ),
        builder: {
          provider: {
            demand: false,
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
      .command({
        command: 'assume [role]',
        describe: 'Assume a role',
        handler: async ({ role, org, provider, headless }) =>
          loginWrapper(this.messagesHelper, 'user:email', () =>
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
        command: 'init',
        describe: '(Administrative) Initialize SAML.to with a GitHub Repository',
        handler: async ({ force }) => {
          await this.init.handle(force as boolean | undefined);
        },
        builder: {
          force: {
            demand: false,
            type: 'boolean',
            default: false,
          },
        },
      })
      .command({
        command: 'add [type] [name]',
        describe: '(Administrative) Add providers or permissions to the configuration',
        handler: async ({
          type,
          name,
          entityId,
          acsUrl,
          loginUrl,
          nameId,
          nameIdFormat,
          role,
          attribute,
        }) => {
          await loginWrapper(this.messagesHelper, 'repo', () =>
            this.add.handle(
              type as AddSubcommands,
              name as string | undefined,
              entityId as string | undefined,
              acsUrl as string | undefined,
              loginUrl as string | undefined,
              nameId as string | undefined,
              (nameIdFormat as AddNameIdFormats) || 'none',
              role as string | undefined,
              attribute as AddAttributes | undefined,
            ),
          );
        },
        builder: {
          type: {
            demand: true,
            type: 'string',
            choices: ['provider', 'permission'] as AddSubcommands[],
          },
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
          role: {
            demand: false,
            type: 'string',
          },
          attribute: {
            demand: false,
            type: 'array',
            description: 'Additional addtributes in key=value pairs',
            coerce: (values) => {
              if (!values || !Array.isArray(values)) {
                return;
              }
              return values.reduce((acc, value: string) => {
                try {
                  const ix = value.indexOf('=');
                  if (ix === -1) {
                    throw new Error(`Attributes must be in key=value format`);
                  }
                  const k = value.substring(0, ix);
                  const v = value
                    .substring(ix + 1)
                    .replace(/"(.*)"$/, '$1')
                    .replace(/'(.*)'$/, '$1');
                  return {
                    ...acc,
                    [k]: v,
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
        command: 'set [name] [subcommand]',
        describe: '(Administrative) Set a provider setting (e.g. provisioning)',
        handler: async ({ name, subcommand, type, endpoint, token }) => {
          await loginWrapper(this.messagesHelper, 'repo', () =>
            this.set.handle(
              subcommand as SetSubcommands,
              name as string,
              {
                type: type as ProvisioningTypes | undefined,
                endpoint: endpoint as string | undefined,
                token: token as string | undefined,
              } as SetHandleOpts,
            ),
          );
        },
        builder: {
          name: {
            demand: true,
            type: 'string',
          },
          subcommand: {
            demand: true,
            type: 'string',
            choices: ['provisioning'] as SetSubcommands[],
          },
          type: {
            demand: false,
            type: 'string',
            choices: ['scim'] as ProvisioningTypes[],
          },
          endpoint: {
            demand: false,
            type: 'string',
          },
          token: {
            demand: false,
            type: 'string',
          },
        },
      })
      .command({
        command: 'show [subcommand]',
        describe: `(Administrative) Show various configurations (metadata, certificate, entityId, config, etc.)`,
        handler: async ({ org, provider, subcommand, save, refresh, raw }) => {
          await loginWrapper(this.messagesHelper, 'user:email', async () => {
            await this.show.handle(
              subcommand as ShowSubcommands,
              org as string | undefined,
              provider as string | undefined,
              save as boolean | undefined,
              refresh as boolean | undefined,
              raw as boolean | undefined,
            );
          });
        },
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
          provider: {
            demand: false,
            type: 'string',
            description: 'Specify a provider',
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
        command: 'google',
        handler: async () => {
          await open('https://google.com', {});
        },
      })
      .help()
      .wrap(null)
      .version(version)
      .fail((msg, error) => {
        if (axios.isAxiosError(error)) {
          if (error.response && error.response.status === 401) {
            ui.updateBottomBar('');
            console.error(
              `Unauthorized. Please generate a new GitHub Identity using the \`${this.messagesHelper.processName} login\` command`,
            );
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
          console.error(`Error: ${error ? error.message : msg}`);
        }
        process.exit(-1);
      });

    const parsed = await ya.parse(hideBin(argv));

    if (parsed._.length === 0) {
      ya.showHelp();
    }
  }
}
