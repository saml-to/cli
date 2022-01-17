#!/usr/bin/env node

import { Command } from '../src/command';

(async () => {
  const command = new Command(process.argv);
  try {
    await command.run(process.argv);
    process.exit(0);
  } catch (e) {
    process.exit(-1);
  }
})();
