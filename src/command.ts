/* eslint-disable no-console */
// import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
// import log from 'loglevel';

import yargs from 'yargs';
import { ListRoles } from './commands/list-roles';
import axios from 'axios';
import { GithubLogin } from './commands/github-login';
import { NOT_LOGGED_IN } from './messages';
import { Assume } from './commands/assume';

export class Command {
  private listRoles: ListRoles;

  private githubLogin: GithubLogin;

  private assume: Assume;

  constructor(private name: string) {
    this.githubLogin = new GithubLogin();
    this.listRoles = new ListRoles();
    this.assume = new Assume();
  }

  public async run(argv: string[]): Promise<void> {
    await yargs
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
      // .command({
      //   command: 'generate [moduleType] [moduleNames...]',
      //   describe: 'Generates a resource',
      //   handler: (parsed) => console.log('your handler goes here', parsed),
      //   builder: {
      //     moduleType: {
      //       demand: true,
      //       choices: ['routed', 'stateful'] as const,
      //       default: 'routed',
      //     },
      //     moduleNames: {
      //       demand: true,
      //       array: true,
      //     },
      //   },
      // })
      .help()
      .showHelpOnFail(true)
      .strict()
      .wrap(null)
      .fail((_, error) => {
        if (axios.isAxiosError(error)) {
          if (error.response && error.response.status === 401) {
            console.error(NOT_LOGGED_IN);
          } else {
            console.error(
              `API Error: ${
                (error.response && error.response.data && error.response.data.message) ||
                error.message
              }`,
              // error,
            );
          }
        } else {
          console.error(`Error: ${error.message}`);
        }
        process.exit(-1);
      })
      .parse(hideBin(argv));
  }
}
