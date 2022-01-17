#!/usr/bin/env node

import { Command } from '../src/command';

(async () => {
  const command = new Command(process.argv);
  await command.run(process.argv);
})();
