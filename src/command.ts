import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';
import axios from 'axios';
import { AssumeCommand } from './commands/assume';
// import { InitCommand } from './commands/init';
import { ShowCommand, ShowSubcommands } from './commands/show';
// import { ProvisioningTypes, SetCommand, SetHandleOpts, SetSubcommands } from './commands/set';
import inquirer, { QuestionCollection } from 'inquirer';
import { NoTokenError } from './stores/scms';
import { GithubHelper } from './helpers/githubHelper';
// import { AddCommand, AddAttributes, AddNameIdFormats, AddSubcommands } from './commands/add';
import { LoginCommand } from './commands/login';
import { MessagesHelper } from './helpers/messagesHelper';
import PromptUI from 'inquirer/lib/ui/prompt';
import { version } from '../package.json';
import { ApiHelper } from './helpers/apiHelper';
import BottomBar from 'inquirer/lib/ui/bottom-bar';
import { NOT_LOGGED_IN } from './messages';
import { ErrorWithReturnCode, RETURN_CODE_NOT_LOGGED_IN } from './errors';

export let ui: BottomBar;

// Disables (node:64080) ExperimentalWarning: The Fetch API is an experimental feature. This feature could change at any time
process.emitWarning = () => {};

if (!process.argv.find((arg) => arg === '--headless')) {
  ui = new BottomBar({ output: process.stderr });
} else {
  ui = {} as BottomBar;
  ui.updateBottomBar = () => ui;
}

process.addListener('SIGINT', () => {
  console.log('Exiting!');
  process.exit(0);
});

export const prompt = <T extends inquirer.Answers>(
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
  private apiHelper: ApiHelper;

  private messagesHelper: MessagesHelper;

  private assume: AssumeCommand;

  private login: LoginCommand;

  // private init: InitCommand;

  private show: ShowCommand;

  // private add: AddCommand;

  // private set: SetCommand;

  constructor(argv: string[]) {
    this.apiHelper = new ApiHelper(argv);
    this.messagesHelper = new MessagesHelper(argv);
    this.assume = new AssumeCommand(this.apiHelper, this.messagesHelper);
    this.login = new LoginCommand(this.apiHelper, this.messagesHelper);
    // this.init = new InitCommand(this.apiHelper, this.messagesHelper);
    this.show = new ShowCommand(this.apiHelper);
    // this.add = new AddCommand(this.apiHelper, this.messagesHelper);
    // this.set = new SetCommand(this.apiHelper);
  }

  public async run(argv: string[]): Promise<void> {
    const ya = yargs
      .scriptName(this.messagesHelper.processName)
      // .command({
      //   command: 'list-logins',
      //   describe: `Show providers that are available to login`,
      //   handler: ({ org, provider, refresh }) =>
      //     this.loginWrapper('user:email', () =>
      //       this.show.handle(
      //         'logins' as ShowSubcommands,
      //         org as string | undefined,
      //         provider as string | undefined,
      //         false,
      //         refresh as boolean | undefined,
      //         false,
      //       ),
      //     ),
      //   builder: {
      //     org: {
      //       demand: false,
      //       type: 'string',
      //       description: 'Specify an organization',
      //     },
      //     provider: {
      //       demand: false,
      //       type: 'string',
      //       description: 'Specify an provider',
      //     },
      //     refresh: {
      //       demand: false,
      //       type: 'boolean',
      //       default: false,
      //       description: 'Refresh cached logins from source control',
      //     },
      //   },
      // })
      .command({
        command: 'list-roles',
        describe: `Show roles that are available to assume`,
        handler: ({ org, provider, refresh }) =>
          this.loginWrapper('user:email', () =>
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
        handler: ({ org, provider, withToken }) =>
          this.loginWrapper('user:email', () =>
            this.login.handle(
              provider as string | undefined,
              org as string | undefined,
              withToken as string | undefined,
            ),
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
          withToken: {
            demand: false,
            type: 'string',
            description: 'Skip Device Authentication and save the provided token to ~/.saml-to/',
          },
        },
      })
      .command({
        command: 'assume [role]',
        describe: 'Assume a role',
        handler: ({ role, org, provider, headless, save, withToken }) =>
          this.loginWrapper(
            'user:email',
            () =>
              this.assume.handle(
                role as string,
                headless as boolean,
                org as string | undefined,
                provider as string | undefined,
                save as string | undefined,
                withToken as string | undefined,
              ),
            headless as boolean,
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
          save: {
            demand: false,
            type: 'string',
            description:
              'Similar to headless, but saves the CLI configuration for a provider to the config file',
          },
          provider: {
            demand: false,
            type: 'string',
            description: 'Specify the provider',
          },
          withToken: {
            demand: false,
            type: 'string',
            description: 'Use the provided token (defaults to using the token in ~/.saml-to/)',
          },
        },
      })
      // .command({
      //   command: 'init',
      //   describe: '(Administrative) Initialize SAML.to with a GitHub Repository',
      //   handler: ({ force }) => this.init.handle(force as boolean | undefined),
      //   builder: {
      //     force: {
      //       demand: false,
      //       type: 'boolean',
      //       default: false,
      //     },
      //   },
      // })
      // .command({
      //   command: 'add [type] [name]',
      //   describe: '(Administrative) Add providers or permissions to the configuration',
      //   handler: ({
      //     type,
      //     name,
      //     entityId,
      //     acsUrl,
      //     loginUrl,
      //     nameId,
      //     nameIdFormat,
      //     role,
      //     attribute,
      //   }) =>
      //     this.loginWrapper('repo', () =>
      //       this.add.handle(
      //         type as AddSubcommands,
      //         name as string | undefined,
      //         entityId as string | undefined,
      //         acsUrl as string | undefined,
      //         loginUrl as string | undefined,
      //         nameId as string | undefined,
      //         (nameIdFormat as AddNameIdFormats) || 'none',
      //         role as string | undefined,
      //         attribute as AddAttributes | undefined,
      //       ),
      //     ),
      //   builder: {
      //     type: {
      //       demand: true,
      //       type: 'string',
      //       choices: ['provider', 'permission'] as AddSubcommands[],
      //     },
      //     name: {
      //       demand: false,
      //       type: 'string',
      //     },
      //     entityId: {
      //       demand: false,
      //       type: 'string',
      //     },
      //     acsUrl: {
      //       demand: false,
      //       type: 'string',
      //     },
      //     loginUrl: {
      //       demand: false,
      //       type: 'string',
      //     },
      //     nameId: {
      //       demand: false,
      //       type: 'string',
      //     },
      //     nameIdFormat: {
      //       demand: false,
      //       type: 'string',
      //       choices: ['id', 'login', 'email', 'emailV2', 'none'] as AddNameIdFormats[],
      //     },
      //     role: {
      //       demand: false,
      //       type: 'string',
      //     },
      //     attribute: {
      //       demand: false,
      //       type: 'array',
      //       description: 'Additional addtributes in key=value pairs',
      //       coerce: (values) => {
      //         if (!values || !Array.isArray(values)) {
      //           return;
      //         }
      //         return values.reduce((acc, value: string) => {
      //           try {
      //             const ix = value.indexOf('=');
      //             if (ix === -1) {
      //               throw new Error(`Attributes must be in key=value format`);
      //             }
      //             const k = value.substring(0, ix);
      //             const v = value
      //               .substring(ix + 1)
      //               .replace(/"(.*)"$/, '$1')
      //               .replace(/'(.*)'$/, '$1');
      //             return {
      //               ...acc,
      //               [k]: v,
      //             };
      //           } catch (e) {
      //             if (e instanceof Error) {
      //               throw new Error(`Error parsing ${value}: ${e.message}`);
      //             }
      //           }
      //         }, {} as AddAttributes);
      //       },
      //     },
      //   },
      // })
      // .command({
      //   command: 'set [name] [subcommand]',
      //   describe: '(Administrative) Set a provider setting (e.g. provisioning)',
      //   handler: ({ name, subcommand, type, endpoint, token }) =>
      //     this.loginWrapper('repo', () =>
      //       this.set.handle(
      //         subcommand as SetSubcommands,
      //         name as string,
      //         {
      //           type: type as ProvisioningTypes | undefined,
      //           endpoint: endpoint as string | undefined,
      //           token: token as string | undefined,
      //         } as SetHandleOpts,
      //       ),
      //     ),
      //   builder: {
      //     name: {
      //       demand: true,
      //       type: 'string',
      //     },
      //     subcommand: {
      //       demand: true,
      //       type: 'string',
      //       choices: ['provisioning'] as SetSubcommands[],
      //     },
      //     type: {
      //       demand: false,
      //       type: 'string',
      //       choices: ['scim'] as ProvisioningTypes[],
      //     },
      //     endpoint: {
      //       demand: false,
      //       type: 'string',
      //     },
      //     token: {
      //       demand: false,
      //       type: 'string',
      //     },
      //   },
      // })
      // .command({
      //   command: 'show [subcommand]',
      //   describe: `(Administrative) Show various configurations (metadata, certificate, entityId, config, etc.)`,
      //   handler: ({ org, provider, subcommand, save, refresh, raw }) =>
      //     this.loginWrapper('user:email', async () =>
      //       this.show.handle(
      //         subcommand as ShowSubcommands,
      //         org as string | undefined,
      //         provider as string | undefined,
      //         save as boolean | undefined,
      //         refresh as boolean | undefined,
      //         raw as boolean | undefined,
      //       ),
      //     ),
      //   builder: {
      //     subcommand: {
      //       demand: true,
      //       type: 'string',
      //       choices: [
      //         'metadata',
      //         'certificate',
      //         'entityId',
      //         'loginUrl',
      //         'logoutUrl',
      //         'config',
      //         'roles',
      //         'logins',
      //         'orgs',
      //       ] as ShowSubcommands[],
      //     },
      //     org: {
      //       demand: false,
      //       type: 'string',
      //       description: 'Specify an organization',
      //     },
      //     provider: {
      //       demand: false,
      //       type: 'string',
      //       description: 'Specify a provider',
      //     },
      //     save: {
      //       demand: false,
      //       type: 'boolean',
      //       description: 'Output to a file',
      //     },
      //     refresh: {
      //       demand: false,
      //       type: 'boolean',
      //       default: false,
      //       description: 'Refresh backend config',
      //     },
      //     raw: {
      //       demand: false,
      //       type: 'boolean',
      //       default: false,
      //       description: 'For `config` subcommand, show raw configuration',
      //     },
      //   },
      // })
      .help()
      .wrap(null)
      .version(version)
      .fail((msg, error) => {
        if (axios.isAxiosError(error)) {
          if (error.response && error.response.status === 401) {
            ui.updateBottomBar('');
            console.error(NOT_LOGGED_IN(this.messagesHelper.processName, 'github'));
          } else {
            ui.updateBottomBar('');
            console.error(
              `API Error: ${
                (error.response &&
                  error.response.data &&
                  (error.response.data as { message: string }).message) ||
                error.message
              }`,
            );
          }
        } else {
          console.error(`Error: ${error ? error.message : msg}`);
        }
      });

    const parsed = await ya.parse(hideBin(argv));

    if (parsed._.length === 0) {
      ya.showHelp();
    }
  }

  private loginWrapper = async (
    scope: string,
    fn: () => Promise<void>,
    headless = false,
  ): Promise<void> => {
    try {
      await fn();
    } catch (e) {
      if (e instanceof NoTokenError) {
        if (!headless) {
          const githubLogin = new GithubHelper(this.apiHelper, this.messagesHelper);
          await githubLogin.promptLogin(scope);
          await fn();
        } else {
          throw new ErrorWithReturnCode(
            RETURN_CODE_NOT_LOGGED_IN,
            NOT_LOGGED_IN(this.messagesHelper.processName, 'github'),
          );
        }
      } else {
        throw e;
      }
    }
  };
}
