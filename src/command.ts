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
import { NOT_LOGGED_IN } from './messages';
import { ErrorWithReturnCode, RETURN_CODE_NOT_LOGGED_IN } from './errors';
import { outputStream } from '../cli';
import { BottomBar } from './ui';

process.addListener('SIGINT', () => {
  console.log('Exiting!');
  process.exit(0);
});

export const ui = new BottomBar(outputStream);

export const prompt = <T extends inquirer.Answers>(
  field: string,
  questions: QuestionCollection<T>,
  initialAnswers?: Partial<T>,
  stream?: NodeJS.WriteStream,
): Promise<T> & { ui: PromptUI<T> } => {
  if (!process.stdin.isTTY) {
    throw new Error(`TTY was disabled while attempting to collect \`${field}\`.`);
  }
  return inquirer.createPromptModule({ output: stream || outputStream })(questions, initialAnswers);
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
      .command({
        command: 'list-roles',
        describe: `Show roles that are available to assume`,
        handler: ({ org, provider, refresh, withToken }) =>
          this.loginWrapper('user:email', () =>
            this.show.handle(
              'roles' as ShowSubcommands,
              org as string | undefined,
              provider as string | undefined,
              false,
              refresh as boolean | undefined,
              false,
              withToken as string | undefined,
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
          withToken: {
            demand: false,
            type: 'string',
            description: 'Use the provided token (defaults to using the token in ~/.saml-to/)',
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
          ui.updateBottomBar('');
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
