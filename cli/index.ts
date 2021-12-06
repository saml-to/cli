#!/usr/bin/env node

import { comingSoon } from '../src';
import log from 'loglevel';

(async () => {
  try {
    log.debug('Starting CLI');
    // eslint-disable-next-line no-console
    console.log(comingSoon());
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
