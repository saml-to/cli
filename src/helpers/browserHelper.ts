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
        proc.addListener('exit', () => {
          resolve();
        });
      } else if (wait && proc.exitCode !== 0) {
        ui.updateBottomBar('');
        console.log(url);
        resolve();
      } else {
        resolve();
      }
      // if (process.platform === 'win32') {
      //   proc.addListener('close', () => {
      //     resolve();
      //   });
      //   return;
      // } else if (wait && proc.exitCode !== 0) {
      //   console.log(url);
      //   resolve();
      // } else {
      //   console.log(`Browser opened to ${new URL(url).origin}`);
      //   resolve();
      // }
    });
  });
};
