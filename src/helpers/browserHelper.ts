import open from 'open';
import { ui } from '../command';

export const openBrowser = (url: string): Promise<void> => {
  return new Promise((resolve) => {
    ui.updateBottomBar('');
    open(url, {
      wait: true,
    }).then((proc) => {
      if (proc.exitCode !== 0) {
        ui.updateBottomBar('');
        console.log(url);
        resolve();
      } else {
        resolve();
      }
    });
  });
};
