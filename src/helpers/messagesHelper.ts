import { ui } from '../command';

export class MessagesHelper {
  _headless = false;

  set headless(value: boolean) {
    this._headless = value;
  }

  get headless(): boolean {
    return this._headless;
  }

  constructor(private processName: string) {
    console.log('!!! processName', this.processName);
  }

  private print(str: string) {
    if (this.headless) {
      return;
    }
    ui.updateBottomBar('');
    process.stderr.write(str);
    process.stderr.write('\n');
  }

  introduction(configFile: string): void {
    this.print(`
Welcome to the SAML.to CLI!

SAML.to enables administrators to grant access to Service Providers to GitHub users.

All configuration is managed by a config file in a repository of your choice named \`${configFile}\`.

This utility will assist you with the following:
 - Choosing a GitHub repository to store \`${configFile}\`
 - Setting up one or more Service Providers
 - Granting permissions to GitHub users to login or assume roles at the Service Providers
 - Logging in or assuming roles at the Service Providers

Once configured, you (or users on your team or organization) will be able to login to services or assume roles using this utility.

For more information, check out https://docs.saml.to
`);
  }
}
