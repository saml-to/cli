import inquirer from 'inquirer';

export class GenericHelper {
  public async promptUsers(
    provider: string,
    role?: string,
    users: string[] = [],
  ): Promise<string[]> {
    const { user } = await inquirer.prompt({
      type: 'input',
      name: 'user',
      message: `What is the Github ID of the user that will be allowed to ${
        role ? `assume \`${role}\`` : `login to ${provider}`
      }? (Leave blank if finished adding users)
`,
    });

    if (!user) {
      return users;
    }

    users.push(user);

    return this.promptUsers(provider, role, users);
  }

  outputEnv(
    vars: { [key: string]: string },
    platform: NodeJS.Platform | 'github' = process.platform,
  ): void {
    let prefix = 'export';
    let separator = '=';
    switch (platform) {
      case 'win32':
        prefix = 'setx';
        break;
      case 'github':
        prefix = '::set-output';
        separator = '::';
        break;
      default:
        break;
    }

    Object.entries(vars).forEach(([key, value]) => {
      console.log(`${prefix} ${key}${separator}"${value}"`);
    });
  }
}
