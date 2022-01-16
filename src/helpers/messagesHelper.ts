import { ui } from '../command';

type Context = {
  provider?: string;
  loginType?: 'sso-user' | 'role-user';
};

export class MessagesHelper {
  processName = 'saml-to';

  context: Context = {
    provider: undefined,
    loginType: undefined,
  };

  _headless = false;

  set headless(value: boolean) {
    this._headless = value;
  }

  get headless(): boolean {
    return this._headless;
  }

  constructor(argv: string[]) {
    const cmd = argv[1];
    if (cmd && cmd.indexOf('_npx') !== -1) {
      this.processName = 'npx saml-to';
    }
  }

  public status(str?: string): void {
    if (str) {
      ui.updateBottomBar(`${str}...`);
    } else {
      ui.updateBottomBar('');
    }
  }

  public write(str: string): void {
    if (this.headless) {
      return;
    }
    this.status();
    process.stderr.write(str);
    process.stderr.write('\n');
  }

  introduction(configFile: string): void {
    this.write(`
Welcome to the SAML.to CLI!

SAML.to enables administrators to grant access to Service Providers to GitHub users.

All configuration is managed by a config file in a repository of your choice named \`${configFile}\`.

This utility will assist you with the following:
 - Choosing a GitHub repository to store the \`${configFile}\` configuration file
 - Setting up one or more Service Providers
 - Granting permissions to GitHub users to login or assume roles at the Service Providers
 - Logging in or assuming roles at the Service Providers

Once configured, you (or users on your team or organization) will be able to login to services or assume roles using this utility, with commands such as:
 - \`${this.processName} list-logins\`
 - \`${this.processName} login\`
 - \`${this.processName} list-roles\`
 - \`${this.processName} assume\`

For more information, check out https://docs.saml.to
`);
  }

  prelogin(scope: string, org?: string, repo?: string): void {
    if (scope === 'user:email') {
      this.write(`
To continue, we need you to log into GitHub, and we will need the \`${scope}\` scope to access your GitHub Identity.
`);
    } else {
      if (org && repo) {
        this.write(`
To continue, we need you to log into GitHub, and we will need the \`${scope}\` scope to access \`${org}/${repo}\`.
`);
      } else if (org) {
        this.write(`
To continue, we need you to log into GitHub, and we will need the \`${scope}\` scope to access \`${org}\`.
`);
      } else if (repo) {
        this.write(`
To continue, we need you to log into GitHub, and we will need the \`${scope}\` scope to access \`${repo}\`.
`);
      }
    }
  }

  postInit(org: string, repo: string, configFileUrl: string): void {
    this.write(`
GitHub is now configured as an Identity Provider using \`${org}/${repo}\`.

The confiruration file can be found here:
  ${configFileUrl}

Service Providers will need your SAML Metadata, Certificicate, Entity ID or Login URL available with the following commands:
- \`${this.processName} show metadata\` (aka 'IdP Metadata')
- \`${this.processName} show certificate\` (aka 'IdP Certificate')
- \`${this.processName} show entityId\` (aka 'IdP Issuer URL', 'IdP Entity ID')
- \`${this.processName} show loginUrl\` (aka 'IdP Sign-In URL', 'SAML 2.0 Endpoint')

Then to add a Service Provider, run the following command and follow the interactive prompts:
 - \`${this.processName} add provider\`
`);
  }

  unknownInitiation(provider: string, configFile: string): void {
    this.write(`
Since it is not know at this time if it is a SP-initiated, or IdP-initiated flow, we're going to leave \`loginUrl\` for \`${provider}\` unset for now.

If it's a SP-initiated flow, you would likely be informed of their "Login URL", and then you can set the \`loginUrl\` property for \`${provider}\` in the \`${configFile}\` configuration file, which will set the Login Flow to be SP-Initiatied.

For more information, check out https://docs.saml.to/troubleshooting/administration/sp-initiated-or-idp-initiated-logins
`);
  }

  getSetup(context: 'roles available to assume' | 'logins configured'): void {
    this.write(`
You have no ${context}!

If this is your first time using SAML.to, you can get started by running:
\`${this.processName} init\`

Alternatively, you may find out which organizations you're a member of with the \`${this.processName} show orgs\` command, then you should reach out to the administrators of those organizations to grant you log in privileges.

For more information on getting started, visit
 - https://saml.to
 - https://docs.saml.to
`);
  }

  providerAdded(): void {
    if (!this.context.provider) {
      throw new Error('Missing provider context');
    }
    if (!this.context.loginType) {
      throw new Error('Missing loginType context');
    }
    this.write(`
Provider \`${this.context.provider}\` has been added!

If you haven't already, update the Service Provider with your configuration:
- \`${this.processName} show metadata\` (aka 'IdP Metadata')
- \`${this.processName} show certificate\` (aka 'IdP Certificate')
- \`${this.processName} show entityId\` (aka 'IdP Issuer URL', 'IdP Entity ID')
- \`${this.processName} show loginUrl\` (aka 'IdP Sign-In URL', 'SAML Endpoint')

If you need to enable SCIM provisioning at the provider:
- \`${this.processName} set provisioning ${this.context.provider}\`

Additional permissions may be added anytime with the following command:
 - \`${this.processName} add permission\`

The configuration file can also be displayed and validated wit this command:
 - \`${this.processName} show config\`

Finally, you or users that were defined in the configuration can run the following command:
 - \`${this.processName} ${this.context.loginType === 'role-user' ? 'assume' : 'login'} ${
      this.context.provider
    }\`
`);
  }
}
