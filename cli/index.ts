#!/usr/bin/env node

import log from 'loglevel';
import { Commamd } from '../src/command';

(async () => {
  try {
    log.debug('Starting CLI');
    const command = new Commamd();
    await command.run(process.argv);
  } catch (e) {
    if (e instanceof Error) {
      // eslint-disable-next-line no-console
      console.error(`Exror: ${e.message}`);
      process.exit(-1);
    }
    throw e;
  }
  process.exit(0);
})();
