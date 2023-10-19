import inquirer from 'inquirer';

export const isHeadless = (): boolean => {
  return !!process.argv.find((arg) => arg === '--headless');
};

export class BottomBar {
  headless = false;
  constructor(private stream: NodeJS.WriteStream) {
    this.headless = isHeadless();
  }

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
