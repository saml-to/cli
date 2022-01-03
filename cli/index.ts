#!/usr/bin/env node

import { Command } from '../src/command';

process.on('SIGINT', () => {
  process.exit(0);
});

(async () => {
  try {
    const command = new Command(process.argv);
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
