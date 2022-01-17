import open from 'open';
import { ui } from '../command';

export const openBrowser = (url: string): Promise<void> => {
  return new Promise((resolve) => {
    ui.updateBottomBar('');
    const wait = process.platform !== 'win32' && process.platform !== 'darwin';
    open(url, {
      wait,
    }).then((proc) => {
      if (process.platform === 'win32') {
        proc.addListener('close', () => {
          resolve();
        });
        return;
      } else if (wait && proc.exitCode !== 0) {
        console.log(url);
      } else {
        console.log(`Browser opened to ${new URL(url).origin}`);
      }
    });
  });
};
