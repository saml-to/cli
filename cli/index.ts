#!/usr/bin/env node

import { ErrorWithReturnCode } from '../src/errors';
import { Command } from '../src/command';

(async () => {
  const command = new Command(process.argv);
  try {
    await command.run(process.argv);
    process.exit(0);
  } catch (e) {
    if (e instanceof ErrorWithReturnCode) {
      process.exit(e.returnCode);
    }
    process.exit(-1);
  }
})();
