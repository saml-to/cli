#!/usr/bin/env node

import log from 'loglevel';
import { Command } from '../src/command';

process.on('SIGINT', () => {
  process.exit(0);
});

(async () => {
  try {
    log.debug('Starting CLI');
    const command = new Command('saml-to');
    await command.run(process.argv);
  } catch (e) {
    if (e instanceof Error) {
      console.error(`Error: ${e.message}`, e);
      process.exit(-1);
    }
    throw e;
  }
  process.exit(0);
})();
