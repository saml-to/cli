import open from 'open';
import { platform } from 'process';
import { ui } from '../command';

export const openBrowser = (url: string): Promise<void> => {
  const displayUrl = new URL(url);
  displayUrl.searchParams.delete('token');

  return new Promise((resolve) => {
    ui.updateBottomBar('');
    open(url, {
      wait: platform !== 'darwin',
    })
      .then((proc) => {
        if (platform === 'darwin') {
          resolve();
          return;
        }

        if (proc.exitCode !== 0) {
          ui.updateBottomBar('');
          console.log(`Unable to open browser. Please open in a browser window:

${url}`);
          resolve();
        } else {
          ui.updateBottomBar('');
          console.log(`Browser opened to:

${displayUrl.toString()}

Ctrl+C to exit.`);
          resolve();
        }
      })
      .catch(() => {
        ui.updateBottomBar('');
        console.log(`Unable to open browser. Please open in a browser window:

${url}`);
      });
  });
};
