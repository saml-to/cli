import inquirer from 'inquirer';

export class BottomBar {
  constructor(private headless: boolean, private stream: NodeJS.WriteStream) {}

  public updateBottomBar(text: string) {
    if (!this.headless) {
      if (process.platform === 'win32') {
        // BottomBar on windows causes yarn start commands to emit a exit code of 1 for some reason
        // Write it an ugly way on this edge case
        process.stderr.write(`${text}\n`);
        return;
      }
      new inquirer.ui.BottomBar({ output: this.stream }).updateBottomBar(text);
    }
  }
}
