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
}
